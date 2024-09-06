"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { buildProposalFromArray, placeholderProposal } from "@/utils/helpers";
import {
  FormattedProposal,
  ProposalDataItem,
  Status,
  UnlockStatus,
} from "@/types";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address, formatUnits, parseEventLogs, parseUnits } from "viem";
import { config } from "@/utils/wagmi";
import { getBlock, waitForTransactionReceipt } from "@wagmi/core";
import erc20Abi from "@/abis/erc20.json";
import { routerAbi } from "@equito-sdk/evm";
import { generateHash } from "@equito-sdk/viem";
import { useApprove } from "@/hooks/use-approve";
import { useDeliver } from "@/hooks/use-deliver";
import { format } from "date-fns";

const equitoVoteAbi = equitoVote.abi;

enum VoteOption {
  Yes = 0,
  No = 1,
  Abstain = 2,
}

interface Params {
  id: string;
}

interface VoteProps {
  params: Params;
}

function buildUpdatedProposal(
  formattedProposal: FormattedProposal,
  voteOption: VoteOption,
  amount: string,
) {
  const updatedProposal = { ...formattedProposal };
  const amountNumber = Number(amount);
  if (voteOption === VoteOption.Yes) {
    updatedProposal.numVotesYes += amountNumber;
  } else if (voteOption === VoteOption.No) {
    updatedProposal.numVotesNo += amountNumber;
  } else if (voteOption === VoteOption.Abstain) {
    updatedProposal.numVotesAbstain += amountNumber;
  }
  return updatedProposal;
}

function formatTimestamp(timestampSeconds: number) {
  return !timestampSeconds
    ? ""
    : format(timestampSeconds * 1000, "dd MMM yyyy hh:mm aaaa");
}

export default function Vote({ params }: VoteProps) {
  const { id: proposalId } = params;

  const [status, setStatus] = useState<Status>(Status.IsStart);
  const [amount, setAmount] = useState("");
  const [activeProposal, setActiveProposal] =
    useState<FormattedProposal>(placeholderProposal);

  const amountRef = useRef<HTMLInputElement>(null);

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

  const { data: allowanceData } = useReadContract({
    address: formattedProposal.erc20 as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [userAddress, sourceChain?.equitoVoteContract],
    chainId: sourceChain?.definition.id,
    query: { enabled: !!proposal && !!userAddress && !!sourceChain },
  });
  const allowance = allowanceData as bigint;

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

  const { data: amountLockedTokensData } = useReadContract({
    address: sourceChain?.equitoVoteContract as Address,
    abi: equitoVoteAbi,
    functionName: "balances",
    args: [userAddress, proposalId],
    query: { enabled: !!userAddress && !!sourceChain },
    chainId: sourceChain?.definition.id,
  });
  const amountLockedTokens = amountLockedTokensData as bigint;

  const formattedUserBalance =
    !!userBalance && !!decimalsData
      ? formatUnits(userBalance, decimals)
      : "unavailable";

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveProposal(formattedProposal);
  }, [formattedProposal]);

  const approveERC20 = async () => {
    const hash = await writeContractAsync({
      address: formattedProposal.erc20 as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [sourceChain?.equitoVoteContract, parseUnits(amount, decimals)],
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
        parseUnits(amount, decimals),
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
    try {
      setStatus(Status.IsExecutingBaseTxOnSourceChain);

      await switchChainAsync({ chainId: sourceChain?.definition.id });

      if (Number(formatUnits(allowance, decimals)) < Number(amount)) {
        await approveERC20();
      }

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

      const updatedActiveProposal = buildUpdatedProposal(
        activeProposal,
        voteOption,
        amount,
      );
      setActiveProposal(updatedActiveProposal);

      setStatus(Status.IsStart);
    } catch (error) {
      setStatus(Status.IsRetry);
      console.error(error);
    }
  };

  const onClickUnlock = async () => {
    const hash = await writeContractAsync({
      address: sourceChain?.equitoVoteContract as Address,
      abi: equitoVoteAbi,
      functionName: "unlockTokens",
      args: [proposalId],
      chainId: sourceChain?.definition.id,
    });
    const receipt = await waitForTransactionReceipt(config, {
      hash,
      chainId: sourceChain?.definition.id,
    });
  };

  const statusRenderer = {
    [Status.IsStart]: <div>waiting for action</div>,
    [Status.IsExecutingBaseTxOnSourceChain]: (
      <div>submitting vote on source chain</div>
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
    [Status.IsRetry]: <div>waiting for action</div>,
  };

  const unlockStatusRenderer = {
    [UnlockStatus.IsStart]: (
      <div>
        <button onClick={onClickUnlock}>Unlock</button>
      </div>
    ),
    [UnlockStatus.IsUnlocking]: (
      <div>
        <div>unlock in progress</div>
      </div>
    ),
    [UnlockStatus.IsRetry]: (
      <div>
        <button onClick={onClickUnlock}>Retry</button>
      </div>
    ),
  };

  return (
    <div>
      {isLoadingProposal ? (
        <div>loading</div>
      ) : (
        <div>
          <div>
            <div>
              Created at: {formatTimestamp(activeProposal.startTimestamp)}
            </div>
            <div>
              Finishes at: {formatTimestamp(activeProposal.endTimestamp)}
            </div>
            <div>
              {activeProposal.endTimestamp > Math.floor(Date.now() / 1000)
                ? "Completed"
                : "Active"}
            </div>
            <div>numVotesYes {activeProposal.numVotesYes}</div>
            <div>numVotesNo {activeProposal.numVotesNo}</div>
            <div>numVotesAbstain {activeProposal.numVotesAbstain}</div>
            <div>title {activeProposal.title}</div>
            <div>description {activeProposal.description}</div>
          </div>
          <div>token name: {tokenName}</div>
          <div>token balance: {formattedUserBalance}</div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            ref={amountRef}
            className="text-black"
          />
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.Yes)}
            className="block"
            disabled={!amount}
          >
            Yes
          </button>
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.No)}
            className="block"
            disabled={!amount}
          >
            No
          </button>
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.Abstain)}
            className="block"
            disabled={!amount}
          >
            Abstain
          </button>
          <div>{statusRenderer[status]}</div>
          <div>
            {amountLockedTokens ? (
              <div>
                Amount locked tokens:{" "}
                {formatUnits(amountLockedTokens, decimals)}
                <div>
                  <button onClick={onClickUnlock}>unlock</button>
                </div>
              </div>
            ) : (
              <div>no locked tokens</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
