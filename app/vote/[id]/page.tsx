"use client";

import { useMemo, useState } from "react";
import { destinationChain } from "@/utils/chains";
import { useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { buildProposalFromArray } from "@/utils/helpers";
import {
  FormattedProposal,
  ProposalDataItem,
  ProposalResponse,
  Status,
} from "@/types";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import { Addresses, AddressesPerChain } from "@/addresses";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address, formatUnits, parseEventLogs } from "viem";
import { config } from "@/utils/wagmi";
import { getBlock, waitForTransactionReceipt } from "@wagmi/core";
import erc20Abi from "@/abis/erc20.json";
import { routerAbi } from "@equito-sdk/evm";
import { generateHash } from "@equito-sdk/viem";
import { useApprove } from "@/hooks/use-approve";
import { useDeliver } from "@/hooks/use-deliver";

const equitoVoteAbi = equitoVote.abi;

enum VoteOption {
  Yes = 0,
  No = 1,
  Abstain = 2,
}

export default function Vote({ params }: { params: { id: string } }) {
  const { id: proposalId } = params;

  const [status, setStatus] = useState<Status>(Status.IsStart);

  const {
    sourceChain,
    sourceRouter,
    userAddress,
    destinationRouter,
    destinationChain,
  } = useEquitoVote();

  const fromRouterAddress = sourceRouter?.data;
  const toRouterAddress = destinationRouter?.data;

  const { writeContractAsync } = useWriteContract();

  const { switchChainAsync } = useSwitchChain();

  const approve = useApprove();

  const deliverMessage = useDeliver({
    equito: {
      chain: destinationChain,
      router: destinationRouter,
    },
  });

  const { data: proposalData, isLoading: isLoadingProposal } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "proposals",
    args: [proposalId],
    chainId: destinationChain.definition.id,
  });
  const proposal = proposalData as ProposalDataItem[];

  //@ts-ignore
  const formattedProposal: FormattedProposal = useMemo(
    () => buildProposalFromArray(proposal),
    [proposal],
  );

  const { data: tokenNameData } = useReadContract({
    address: formattedProposal.erc20 as Address,
    abi: erc20Abi,
    functionName: "name",
    chainId: sourceChain?.definition.id,
    query: { enabled: !!proposal },
  });
  const tokenName = tokenNameData as string;

  const { data: userBalanceData } = useReadContract({
    address: formattedProposal.erc20 as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [userAddress],
    chainId: sourceChain?.definition.id,
    query: { enabled: !!proposal && !!userAddress },
  });
  const userBalance = userBalanceData as bigint;

  const { data: decimalsData } = useReadContract({
    address: formattedProposal.erc20 as Address,
    abi: erc20Abi,
    functionName: "decimals",
    chainId: sourceChain?.definition.id,
    query: { enabled: !!proposal && !!userAddress },
  });
  const decimals = decimalsData as number;

  const { data: sourceFee } = useReadContract({
    address: fromRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [sourceChain?.equitoVoteContract as Address],
    query: { enabled: !!fromRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: destinationFee } = useReadContract({
    address: toRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [destinationChain.equitoVoteContract as Address],
    query: { enabled: !!toRouterAddress },
    chainId: destinationChain.definition.id,
  });

  const formattedUserBalance =
    !!userBalance && !!decimalsData
      ? formatUnits(userBalance, decimals)
      : "unavailable";

  const approveERC20 = async () => {
    const hash = await writeContractAsync({
      address: formattedProposal.erc20 as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [sourceChain?.equitoVoteContract, "25000000000000000000"],
    });
    await waitForTransactionReceipt(config, { hash });
  };

  const voteOnProposal = async (voteOption: VoteOption) => {
    const hash = await writeContractAsync({
      address: sourceChain?.equitoVoteContract as Address,
      abi: equitoVoteAbi,
      functionName: "voteOnProposal",
      args: [
        destinationChain.chainSelector,
        proposalId,
        BigInt(0.01e18),
        voteOption,
        formattedProposal.erc20,
      ],
      chainId: sourceChain?.definition.id,
      value: sourceFee,
    });
    return waitForTransactionReceipt(config, {
      hash,
      chainId: sourceChain?.definition.id,
    });
  };

  const onClickVoteOnProposal = async (voteOption: VoteOption) => {
    await switchChainAsync({ chainId: sourceChain.definition.id });
    await approveERC20();
    const voteOnProposalReceipt = await voteOnProposal(voteOption);

    const logs = parseEventLogs({
      abi: routerAbi,
      logs: voteOnProposalReceipt.logs,
    });

    console.log("logs");
    console.log(logs);

    const sendMessageResult = parseEventLogs({
      abi: routerAbi,
      logs: voteOnProposalReceipt.logs,
    }).flatMap(({ eventName, args }) =>
      eventName === "MessageSendRequested" ? [args] : [],
    )[0];

    console.log("sendMessageResult");
    console.log(sendMessageResult);

    setStatus(Status.IsRetrievingBlockOnSourceChain);
    const { timestamp: sendMessageTimestamp } = await getBlock(config, {
      chainId: sourceChain?.definition.id,
      blockNumber: voteOnProposalReceipt.blockNumber,
    });

    setStatus(Status.IsGeneratingProofOnSourceChain);
    const { proof: sendMessageProof, timestamp: resultTimestamp } =
      await approve.execute({
        messageHash: generateHash(sendMessageResult.message),
        fromTimestamp: Number(sendMessageTimestamp) * 1000,
        chainSelector: sourceChain.chainSelector,
      });

    console.log("sendMessageProof");
    console.log(sendMessageProof);

    console.log("resultTimestamp");
    console.log(resultTimestamp);

    setStatus(Status.IsExecutingMessageOnDestinationChain);
    const executionReceipt = await deliverMessage.execute(
      sendMessageProof,
      sendMessageResult.message,
      sendMessageResult.messageData,
      destinationFee,
    );

    console.log("executionReceipt");
    console.log(executionReceipt);

    const executionMessage = parseEventLogs({
      abi: routerAbi,
      logs: executionReceipt.logs,
    }).flatMap(({ eventName, args }) =>
      eventName === "MessageSendRequested" ? [args] : [],
    )[0];

    console.log("executionMessage");
    console.log(executionMessage);

    setStatus(Status.IsStart);
  };

  const statusRenderer = {
    [Status.IsStart]: <div />,
    [Status.IsExecutingBaseTxOnSourceChain]: (
      <div>creating proposal on source chain</div>
    ),
    [Status.IsRetrievingBlockOnSourceChain]: (
      <div>is retriving block from source chain</div>
    ),
    [Status.IsGeneratingProofOnSourceChain]: (
      <div>generating proof source chain</div>
    ),
    [Status.IsExecutingMessageOnDestinationChain]: (
      <div>executing message on destination chain</div>
    ),
    [Status.IsRetry]: <div />,
  };

  return (
    <div>
      {isLoadingProposal ? (
        <div>loading</div>
      ) : (
        <div>
          <div>
            <div>startTimestamp {formattedProposal.startTimestamp}</div>
            <div>endTimestamp {formattedProposal.endTimestamp}</div>
            <div>numVotesYes {formattedProposal.numVotesYes}</div>
            <div>numVotesNo {formattedProposal.numVotesNo}</div>
            <div>numVotesAbstain {formattedProposal.numVotesAbstain}</div>
            <div>erc20 {formattedProposal.erc20}</div>
            <div>creator {formattedProposal.creator}</div>
            <div>title {formattedProposal.title}</div>
            <div>description {formattedProposal.description}</div>
            <div>id {formattedProposal.id}</div>
          </div>
          <div>token name: {tokenName}</div>
          <div>token balance: {formattedUserBalance}</div>
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.Yes)}
            className="block"
          >
            Yes
          </button>
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.No)}
            className="block"
          >
            No
          </button>
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.Abstain)}
            className="block"
          >
            Abstain
          </button>
          <div>{statusRenderer[status]}</div>
        </div>
      )}
    </div>
  );
}
