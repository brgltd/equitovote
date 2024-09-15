"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import {
  buildProposalFromArray,
  formatTimestamp,
  placeholderProposal,
  verifyIsGetPastVotesEnabled,
  verifyIsProposalActive,
} from "@/utils/helpers";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address, formatUnits, parseEventLogs, parseUnits } from "viem";
import { format } from "date-fns";
import { config } from "@/utils/wagmi";
import { getBlock, waitForTransactionReceipt } from "@wagmi/core";
import { routerAbi } from "@equito-sdk/evm";
import { generateHash } from "@equito-sdk/viem";
import { useApprove } from "@/hooks/use-approve";
import { useDeliver } from "@/hooks/use-deliver";
import { FormattedProposal, ProposalDataItem, Status } from "@/types";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";
import erc20Votes from "@/out/ERC20Votes.sol/ERC20Votes.json";
import { Tooltip } from "@mui/material";

const equitoVoteAbi = equitoVote.abi;
const erc20VotesAbi = erc20Votes.abi;

const isGetPastVotesEnabled = verifyIsGetPastVotesEnabled();

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

function formatBigInt(input: bigint | undefined) {
  return !input ? "N/A" : Number(input);
}

function formatBalance(
  input: bigint | undefined,
  decimals: number | undefined,
) {
  return !input || !decimals
    ? "N/A"
    : Number(formatUnits(input, decimals)).toFixed(4);
}

export default function VotePage({ params }: VoteProps) {
  const { id: proposalId } = params;

  const [status, setStatus] = useState<Status>(Status.IsStart);
  const [amount, setAmount] = useState("");
  const [activeProposal, setActiveProposal] =
    useState<FormattedProposal>(placeholderProposal);
  const [isDelegating, setIsDelegating] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  const {
    sourceChain,
    sourceRouter,
    userAddress,
    destinationRouter,
    destinationChain,
  } = useEquitoVote();

  const sourceRouterAddress = sourceRouter?.data;

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

  const {
    data: proposalData,
    isLoading: isLoadingProposal,
    isError: isErrorFetchingProposals,
    error: errorFetchingProposals,
  } = useReadContract({
    address: destinationChain.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "proposals",
    args: [proposalId],
    chainId: destinationChain.definition.id,
  });
  const proposal = proposalData as ProposalDataItem[];

  //@ts-ignore
  const formattedProposal: FormattedProposal = useMemo(
    () => buildProposalFromArray(proposal, true),
    [proposal],
  );

  const isProposalActive = useMemo(
    () => verifyIsProposalActive(formattedProposal),
    [formattedProposal],
  );

  const isProposalLoaded = useMemo(
    () => !!Object.keys(formattedProposal || {}).length,
    [formattedProposal],
  );

  // Token address for the chain that the user is currently connected
  const { data: tokenAddressData } = useReadContract({
    address: destinationChain.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "tokenData",
    args: [formattedProposal?.tokenName, sourceChain?.chainSelector],
    chainId: destinationChain.definition.id,
    query: {
      enabled: isProposalLoaded && !!sourceChain,
    },
  });
  const tokenAddress = tokenAddressData as Address | undefined;

  const { data: clockModeData } = useReadContract({
    address: tokenAddress,
    abi: erc20VotesAbi,
    functionName: "CLOCK_MODE",
    chainId: sourceChain?.definition.id,
    query: { enabled: !!tokenAddress },
  });
  const clockMode = clockModeData as string | undefined;

  const { data: userTokenBalanceData } = useReadContract({
    address: tokenAddress,
    abi: erc20VotesAbi,
    functionName: "balanceOf",
    args: [userAddress],
    chainId: sourceChain?.definition.id,
    query: { enabled: !!tokenAddress },
  });
  const userTokenBalance = userTokenBalanceData as bigint | undefined;

  const { data: amountDelegatedTokensData } = useReadContract({
    address: tokenAddress,
    abi: erc20VotesAbi,
    functionName: isGetPastVotesEnabled ? "getPastVotes" : "getVotes",
    args: isGetPastVotesEnabled
      ? [
          userAddress,
          clockMode === "mode=blocknumber&from=default"
            ? formattedProposal.startBlockNumber
            : formattedProposal.startTimestamp,
        ]
      : [userAddress],
    chainId: sourceChain?.definition.id,
    query: {
      // If isGetPastVotesEnabled is false, then clock mode is irrelevant.
      enabled: !!tokenAddress && (!isGetPastVotesEnabled || !!clockMode),
    },
  });
  const amountDelegatedTokens = amountDelegatedTokensData as bigint | undefined;

  const { data: amountUserVotesData } = useReadContract({
    address: sourceChain?.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "userVotes",
    args: [userAddress, formattedProposal?.id],
    chainId: sourceChain?.definition.id,
    query: { enabled: isProposalLoaded && !!sourceChain && !!userAddress },
  });
  const amountUserVotes = amountUserVotesData as bigint | undefined;

  const { data: decimalsData } = useReadContract({
    address: tokenAddress,
    abi: erc20VotesAbi,
    functionName: "decimals",
    chainId: sourceChain?.definition.id,
    query: { enabled: !!tokenAddress },
  });
  const decimals = decimalsData as number;

  const { data: sourceFee } = useReadContract({
    address: fromRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [sourceChain?.equitoVoteContractV2 as Address],
    query: { enabled: !!fromRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: destinationFee } = useReadContract({
    address: toRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [destinationChain.equitoVoteContractV2 as Address],
    query: { enabled: !!toRouterAddress },
    chainId: destinationChain.definition.id,
  });

  const { data: voteOnProposalFeeData } = useReadContract({
    address: sourceChain?.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "voteOnProposalFee",
    query: { enabled: !!sourceRouterAddress },
    chainId: sourceChain?.definition.id,
  });
  const voteOnProposalFee = voteOnProposalFeeData as bigint;

  const totalVoteOnProposalFee =
    !!sourceFee && !!voteOnProposalFee
      ? sourceFee + voteOnProposalFee
      : BigInt(0);

  const isVoteButtonEnabled = useMemo(
    () => !!tokenAddress && !!amount,
    [tokenAddress, amount],
  );

  useEffect(() => {
    amountRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveProposal(formattedProposal);
  }, [formattedProposal]);

  const onClickDelegate = async () => {
    setIsDelegating(true);
    try {
      const hash = await writeContractAsync({
        address: tokenAddress as Address,
        abi: erc20VotesAbi,
        functionName: "delegate",
        args: [userAddress],
        chainId: sourceChain?.definition.id,
      });
      await waitForTransactionReceipt(config, {
        hash,
        chainId: sourceChain?.definition.id,
      });
    } catch (error) {
      console.error(error);
    }
    setIsDelegating(false);
  };

  const voteOnProposal = async (voteOption: VoteOption) => {
    const hash = await writeContractAsync({
      address: sourceChain?.equitoVoteContractV2 as Address,
      abi: equitoVoteAbi,
      functionName: "voteOnProposal",
      args: [
        destinationChain.chainSelector,
        proposalId,
        parseUnits(amount, decimals),
        voteOption,
        tokenAddress,
        isGetPastVotesEnabled,
      ],
      chainId: sourceChain?.definition.id,
      value: totalVoteOnProposalFee,
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

  const statusRenderer = {
    [Status.IsStart]: <div>waiting for action</div>,
    [Status.IsExecutingBaseTxOnSourceChain]: (
      <div>submitting vote on source chain</div>
    ),
    [Status.IsRetrievingBlockOnSourceChain]: (
      <div>is retrieving block from source chain</div>
    ),
    [Status.IsGeneratingProofOnSourceChain]: (
      <div>generating proof source chain</div>
    ),
    [Status.IsExecutingMessageOnDestinationChain]: (
      <div>executing message on destination chain</div>
    ),
    [Status.IsRetry]: <div>waiting for action</div>,
  };

  if (isLoadingProposal) {
    return <div>loading</div>;
  }

  if (isErrorFetchingProposals) {
    console.error(errorFetchingProposals);
    return <div>error</div>;
  }

  return (
    <div>
      <div>
        <div>
          <h1 className="mb-4 text-2xl font-semibold">
            {activeProposal.title}
          </h1>
          <div className="mb-8">{activeProposal.description}</div>
          <div>
            <div>Proposal Info</div>
            <div>
              Status:{" "}
              {activeProposal.endTimestamp > Math.floor(Date.now() / 1000)
                ? "Active"
                : "Completed"}
            </div>
            <div>
              Created at: {formatTimestamp(activeProposal.startTimestamp)}
            </div>
            <div>
              Finishes at: {formatTimestamp(activeProposal.endTimestamp)}
            </div>
            <div>Created on: {activeProposal.originChainSelector}</div>
            <div>Voting Available on:</div>
          </div>
          <hr />
          <div>
            <div>Token Info</div>
            <div>DAO Token Name {activeProposal.tokenName}</div>
            <div>
              Your token balance: {formatBalance(userTokenBalance, decimals)}
            </div>
            <div>
              Delegated Tokens Amount:{" "}
              {formatBalance(amountDelegatedTokens, decimals)}
            </div>
            <div>Casted Votes Amount: {formatBigInt(amountUserVotes)}</div>
            <div>Voting Power: xyz</div>
            <div>
              <button
                onClick={onClickDelegate}
                disabled={!tokenAddress || isDelegating}
              >
                Delegate Tokens
              </button>
              {isDelegating && <div>delegation in progress...</div>}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              ref={amountRef}
              className="text-black"
            />
          </div>
          <hr />
          <div>
            <div>Votes Distribution</div>
            <div>numVotesYes {activeProposal.numVotesYes}</div>
            <div>numVotesNo {activeProposal.numVotesNo}</div>
            <div>numVotesAbstain {activeProposal.numVotesAbstain}</div>
          </div>
        </div>
        <hr />
        <hr />
        <button
          onClick={() => onClickVoteOnProposal(VoteOption.Yes)}
          className="block"
          disabled={!isVoteButtonEnabled}
        >
          Yes
        </button>
        <button
          onClick={() => onClickVoteOnProposal(VoteOption.No)}
          className="block"
          disabled={!isVoteButtonEnabled}
        >
          No
        </button>
        <button
          onClick={() => onClickVoteOnProposal(VoteOption.Abstain)}
          className="block"
          disabled={!isVoteButtonEnabled}
        >
          Abstain
        </button>
        <div>{statusRenderer[status]}</div>
      </div>
    </div>
  );
}
