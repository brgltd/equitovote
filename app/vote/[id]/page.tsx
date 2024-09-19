"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import {
  buildProposalFromArray,
  formatTimestamp,
  isValidData,
  placeholderProposal,
  rearrangeChains,
  verifyIsGetPastVotesEnabled,
  verifyIsProposalActive,
} from "@/utils/helpers";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address, formatUnits, parseEventLogs, parseUnits } from "viem";
import { config } from "@/utils/wagmi";
import { getBlock, switchChain, waitForTransactionReceipt } from "@wagmi/core";
import { routerAbi } from "@equito-sdk/evm";
import { generateHash } from "@equito-sdk/viem";
import { useApprove } from "@/hooks/use-approve";
import { useDeliver } from "@/hooks/use-deliver";
import { FormattedProposal, ProposalDataItem, Status } from "@/types";
import { supportedChains } from "@/utils/chains";
import { Button } from "@/components/button";
import { CircularProgress, Skeleton, TextField, Tooltip } from "@mui/material";
import ThumbUp from "@mui/icons-material/ThumbUp";
import ThumbDown from "@mui/icons-material/ThumbDown";
import AcUnitIcon from "@mui/icons-material/AcUnit";
import { cn } from "@/utils/cn";
import { VoteSkeleton } from "@/components/vote-skeleton";
import { FeeSkeleton } from "@/components/fee-skeleton";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import erc20Votes from "@/out/ERC20Votes.sol/ERC20Votes.json";

const PRECISION = 2;
const ZERO_TOKEN_TEXT = Number(0).toFixed(PRECISION);

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

function formatBalance(
  input: bigint | undefined,
  decimals: number | undefined,
  precision = PRECISION,
) {
  return !input || !decimals
    ? ZERO_TOKEN_TEXT
    : Number(formatUnits(input, decimals)).toFixed(precision);
}

function getInputErrorMessage(
  inputText: string,
  votingPower: string,
  isProposalActive: boolean,
) {
  if (!inputText) {
    return "";
  }
  if (!isProposalActive) {
    return "Proposal is completed";
  }
  const inputNumber = Number(inputText);
  const votingPowerNumber = Number(votingPower);
  if (votingPower === ZERO_TOKEN_TEXT || inputNumber > votingPowerNumber) {
    return "Lack of voting power";
  }
  if (inputNumber < 1) {
    return "Vote amount must be equal or greather than 1";
  }
  return "";
}

function computeDecision(proposal: FormattedProposal) {
  const registry = [
    { id: "YES", amount: proposal.numVotesYes },
    { id: "NO", amount: proposal.numVotesNo },
    { id: "ABSTAIN", amount: proposal.numVotesAbstain },
  ];
  registry.sort((a, b) => b.amount - a.amount);
  if (
    registry[0].amount == registry[1].amount &&
    registry[0].amount == registry[2].amount
  ) {
    return "tie between YES, NO and ABSTAIN";
  } else if (registry[0].amount == registry[1].amount) {
    return `tie between ${registry[0].id} and ${registry[1].id}`;
  }
  return registry[0].id;
}

export default function VotePage({ params }: VoteProps) {
  const { id: proposalId } = params;

  const [status, setStatus] = useState<Status>(Status.IsStart);
  const [amountToVote, setAmountToVote] = useState("");
  const [isDelegating, setIsDelegating] = useState(false);
  const [inputErrorMessage, setInputErrorMessage] = useState("");

  const [activeProposal, setActiveProposal] =
    useState<FormattedProposal>(placeholderProposal);
  const [activeAmountUserVotes, setActiveAmountUserVotes] = useState("");
  const [activeVotingPower, setActiveVotingPower] = useState("");
  const [activeAmountDelegatedTokens, setActiveAmountDelegatedTokens] =
    useState("");

  const {
    sourceChain,
    sourceRouter,
    userAddress,
    destinationRouter,
    destinationChain,
    handleError,
  } = useEquitoVote();

  const sourceRouterAddress = sourceRouter?.data;
  const destinationRouterAddress = destinationRouter?.data;

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
    isPending: isPendingProposal,
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

  const { data: userTokenBalanceData, isPending: isPendingUserTokenBalance } =
    useReadContract({
      address: tokenAddress,
      abi: erc20VotesAbi,
      functionName: "balanceOf",
      args: [userAddress],
      chainId: sourceChain?.definition.id,
      query: { enabled: !!tokenAddress },
    });
  const userTokenBalance = userTokenBalanceData as bigint | undefined;

  const {
    data: amountDelegatedTokensData,
    isPending: isPendingAmountDelegatedTokens,
  } = useReadContract({
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

  const { data: sourceFee, isPending: isPendingSourceFee } = useReadContract({
    address: sourceRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [sourceChain?.equitoVoteContractV2 as Address],
    query: { enabled: !!sourceRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: destinationFee, isPending: isPendingDestinationFee } =
    useReadContract({
      address: destinationRouterAddress,
      abi: routerAbi,
      functionName: "getFee",
      args: [destinationChain.equitoVoteContractV2 as Address],
      query: { enabled: !!destinationRouterAddress },
      chainId: destinationChain.definition.id,
    });

  const { data: voteOnProposalFeeData, isPending: isPendingVoteOnProposalFee } =
    useReadContract({
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

  const balanceMinusDelegation =
    isValidData(userTokenBalance) && isValidData(amountDelegatedTokens)
      ? // @ts-ignore - checks already made with `isValidData`
        userTokenBalance - parseUnits(activeAmountDelegatedTokens, decimals)
      : 0;

  const formattedSourceChainFee = !!sourceFee
    ? `${Number(formatUnits(sourceFee, 18)).toFixed(8)} ${
        sourceChain?.definition?.nativeCurrency?.symbol
      }`
    : "Unavailable";

  const formattedDestinationChainFee = !!destinationFee
    ? `${Number(formatUnits(destinationFee, 18)).toFixed(8)} ${
        destinationChain.definition?.nativeCurrency?.symbol
      }`
    : "Unavailable";

  const formattedCreateProposalFee = !!voteOnProposalFee
    ? `${Number(formatUnits(voteOnProposalFee, 18)).toFixed(8)} ${
        sourceChain?.definition?.nativeCurrency?.symbol
      }`
    : "Unavailable";

  const formattedTotalUserFee =
    !!sourceFee && !!destinationFee && !!voteOnProposalFee
      ? `${Number(formatUnits(sourceFee + destinationFee + voteOnProposalFee, 18)).toFixed(8)} ${
          sourceChain?.definition?.nativeCurrency?.symbol
        }`
      : "Unavailable";

  const isProposalActive = verifyIsProposalActive(activeProposal);

  const hasVotingPower =
    !!activeVotingPower && activeVotingPower !== ZERO_TOKEN_TEXT;

  const isVotingEnabled =
    isProposalActive &&
    !isPendingSourceFee &&
    !isPendingDestinationFee &&
    !isPendingVoteOnProposalFee &&
    (status === Status.IsStart ||
      status === Status.IsCompleted ||
      status === Status.IsRetry);

  const isPendingTokenData =
    isPendingAmountDelegatedTokens || isPendingUserTokenBalance;

  const originChainSelector = activeProposal?.originChainSelector;

  const shouldRenderDecision = !isProposalActive;

  const shouldRenderLackVotingPower =
    !hasVotingPower &&
    activeAmountUserVotes === ZERO_TOKEN_TEXT &&
    (!isPendingTokenData || !userAddress) &&
    isProposalActive;

  const shouldRenderExistingVotes =
    !!activeAmountUserVotes &&
    activeAmountUserVotes !== ZERO_TOKEN_TEXT &&
    !isPendingTokenData;

  const hasUserVotedAllHisTokens =
    shouldRenderExistingVotes &&
    (!activeVotingPower || activeVotingPower === ZERO_TOKEN_TEXT);

  const shouldRenderFees =
    !shouldRenderDecision &&
    !shouldRenderLackVotingPower &&
    !hasUserVotedAllHisTokens;

  const shouldRenderDelegation = balanceMinusDelegation > 0;

  const rearrangedSupportedChains = useMemo(
    () => rearrangeChains(supportedChains, originChainSelector as number, true),
    [originChainSelector],
  );

  const decision = useMemo(
    () => computeDecision(formattedProposal),
    [formattedProposal],
  );

  useEffect(() => {
    setActiveProposal(formattedProposal);
  }, [formattedProposal]);

  useEffect(() => {
    setActiveAmountDelegatedTokens(() =>
      formatBalance(amountDelegatedTokens, decimals),
    );
  }, [amountUserVotes, decimals]);

  useEffect(() => {
    setActiveAmountUserVotes(() => formatBalance(amountUserVotes, decimals, 0));
  }, [amountUserVotes, decimals]);

  useEffect(() => {
    const newVotingPower =
      Number(activeAmountDelegatedTokens) - Number(activeAmountUserVotes);
    const safeNewVotingPower = newVotingPower || 0;
    const formattedNewVotingPower = safeNewVotingPower.toFixed(PRECISION);
    setActiveVotingPower(formattedNewVotingPower);
  }, [activeAmountUserVotes, activeAmountDelegatedTokens]);

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
      setInputErrorMessage("");
      setActiveAmountDelegatedTokens(formatBalance(userTokenBalance, decimals));
    } catch (error) {
      handleError(error);
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
        parseUnits(amountToVote, decimals),
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
    if (!amountToVote) {
      setInputErrorMessage("Please enter input amount");
      return;
    }
    setStatus(Status.IsExecutingBaseTxOnSourceChain);
    try {
      const initialChain = sourceChain;

      await switchChainAsync({ chainId: sourceChain?.definition.id });

      const voteOnProposalReceipt = await voteOnProposal(voteOption);

      const sendMessageResult = parseEventLogs({
        abi: routerAbi,
        logs: voteOnProposalReceipt.logs,
      }).flatMap(({ eventName, args }) =>
        eventName === "MessageSendRequested" ? [args] : [],
      )[0];

      setStatus(Status.IsRetrievingBlockOnSourceChain);
      const { timestamp: sendMessageTimestamp } = await getBlock(config, {
        chainId: sourceChain?.definition.id,
        blockNumber: voteOnProposalReceipt.blockNumber,
      });

      setStatus(Status.IsGeneratingProofOnSourceChain);
      const { proof: sendMessageProof } = await approve.execute({
        messageHash: generateHash(sendMessageResult.message),
        fromTimestamp: Number(sendMessageTimestamp) * 1000,
        chainSelector: sourceChain.chainSelector,
      });

      setStatus(Status.IsExecutingMessageOnDestinationChain);
      await deliverMessage.execute(
        sendMessageProof,
        sendMessageResult.message,
        sendMessageResult.messageData,
        destinationFee,
      );

      const updatedActiveProposal = buildUpdatedProposal(
        activeProposal,
        voteOption,
        amountToVote,
      );
      setActiveProposal(updatedActiveProposal);

      const newActiveAmountUserVotes =
        Number(activeAmountUserVotes) + Number(amountToVote);
      if (newActiveAmountUserVotes) {
        setActiveAmountUserVotes(newActiveAmountUserVotes.toString());
      }

      setStatus(Status.IsCompleted);

      setInputErrorMessage("");
      setAmountToVote("");

      await switchChainAsync({ chainId: initialChain?.definition?.id });
    } catch (error) {
      handleError(error);
      setStatus(Status.IsRetry);
    }
  };

  const statusRenderer = {
    [Status.IsStart]: <></>,
    [Status.IsExecutingBaseTxOnSourceChain]: (
      <div className="flex flex-row items-center mt-4">
        <CircularProgress size={20} />
        <div className="ml-4">Sending votes on source chain</div>
      </div>
    ),
    // Same message as next step since it's executing quickly
    [Status.IsRetrievingBlockOnSourceChain]: (
      <div className="flex flex-row items-center mt-4">
        <CircularProgress size={20} />
        <div className="ml-4">Generating Proof on Source Chain</div>
      </div>
    ),
    [Status.IsGeneratingProofOnSourceChain]: (
      <div className="flex flex-row items-center mt-4">
        <CircularProgress size={20} />
        <div className="ml-4">Generating Proof on Source Chain</div>
      </div>
    ),
    [Status.IsExecutingMessageOnDestinationChain]: (
      <div className="flex flex-row items-center mt-4">
        <CircularProgress size={20} />
        <div className="ml-4">Executing Message on Destination Chain</div>
      </div>
    ),
    [Status.IsRetry]: <></>,
    [Status.IsCompleted]: <></>,
  };

  if (isPendingProposal) {
    return <VoteSkeleton />;
  }

  if (isErrorFetchingProposals) {
    console.error(errorFetchingProposals);
    return <div>Error occurred loading proposal data</div>;
  }

  return (
    <div>
      <div>
        <div>
          <h1 className="mb-4 text-3xl font-semibold">
            {activeProposal.title}
          </h1>
          <div className="mb-8">{activeProposal.description}</div>

          <div className="mb-6">
            <div className="text-xl font-semibold mb-2">Proposal Details</div>
            <div className="flex lg:flex-row flex-col lg:items-center lg:space-y-0 space-y-4">
              <div className="w-48">
                <div className="mb-1">Status</div>
                <div className="flex flex-row items-center">
                  <div
                    className={cn(
                      "mr-2 w-4 h-4 rounded-full",
                      isProposalActive ? "bg-green-600" : "bg-stone-600",
                    )}
                  />{" "}
                  {isProposalActive ? "Live" : "Completed"}
                </div>
              </div>
              <div className="w-60">
                <div className="mb-1">Start Date</div>
                <div>{formatTimestamp(activeProposal.startTimestamp)}</div>
              </div>
              <div className="w-60">
                <div className="mb-1">End Date</div>
                <div>{formatTimestamp(activeProposal.endTimestamp)}</div>
              </div>
              <div>
                <div>Chains</div>
                <div className="flex sm:flex-row flex-col sm:items-center">
                  <div className="md:mb-0 mb-1">Voting available on</div>
                  <div className="flex flex-row">
                    {rearrangedSupportedChains.map((chain) => (
                      <img
                        src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${chain.img}.png`}
                        width={32}
                        height={32}
                        className="rounded-full ml-2"
                        key={chain.definition.id}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xl font-semibold mb-2">Token Information</div>
            <div className="flex lg:flex-row flex-col lg:items-center lg:space-y-0 space-y-4">
              <div className="w-48">
                <div className="mb-1">Token Name</div>
                <div>{activeProposal.tokenName}</div>
              </div>
              <div className="w-60">
                <div className="mb-1">Your Token Balance </div>
                <div>
                  {isPendingUserTokenBalance && userAddress ? (
                    <Skeleton
                      variant="rectangular"
                      animation="wave"
                      width={120}
                      height={16}
                    />
                  ) : (
                    formatBalance(userTokenBalance, decimals)
                  )}
                </div>
              </div>
              <div className="w-60">
                <div className="mb-1">Your Delegated Amount</div>
                {isPendingAmountDelegatedTokens && userAddress ? (
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width={120}
                    height={16}
                  />
                ) : (
                  activeAmountDelegatedTokens
                )}
              </div>
              <div>
                <div className="mb-1">Your Voting Power</div>
                {isPendingTokenData && userAddress ? (
                  <Skeleton
                    variant="rectangular"
                    animation="wave"
                    width={120}
                    height={16}
                  />
                ) : (
                  activeVotingPower
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-xl font-semibold mb-2">Votes Distribution</div>
            <div className="text-green-500 mb-1">
              <span className="w-40 inline-block font-semibold">
                Total Votes Yes
              </span>
              <span className="font-bold">{activeProposal.numVotesYes}</span>
            </div>
            <div className="text-red-500 mb-1">
              <span className="w-40 inline-block font-semibold">
                Total Votes No
              </span>
              <span className="font-bold">{activeProposal.numVotesNo}</span>
            </div>
            <div className="text-yellow-300">
              <span className="w-40 inline-block font-semibold">
                Total Votes Abstain
              </span>
              <span className="font-bold">
                {activeProposal.numVotesAbstain}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-xl font-semibold mb-2">Vote Options</div>
          <div className="flex md:flex-row flex-col items-start mt-4 space-y-4 md:space-y-0">
            <TextField
              id="amountToVote"
              label="Amount"
              type="number"
              value={amountToVote}
              onChange={(e) => {
                const value = e.target.value;
                setInputErrorMessage(
                  getInputErrorMessage(
                    value,
                    activeVotingPower,
                    isProposalActive,
                  ),
                );
                setAmountToVote(value);
              }}
              error={!!inputErrorMessage}
              helperText={inputErrorMessage}
              sx={{
                width: "250px",
              }}
            />
            <Tooltip placement="top" title="Vote for YES">
              <button
                onClick={() => onClickVoteOnProposal(VoteOption.Yes)}
                className="md:ml-4 ml-0 mr-4"
                disabled={!isVotingEnabled}
              >
                <div
                  className={cn(
                    "flex flex-row items-center justify-center w-14 h-14 bg-green-500 rounded-lg",
                    hasVotingPower && isVotingEnabled
                      ? "cursor-pointer"
                      : "cursor-not-allowed",
                  )}
                >
                  <ThumbUp fontSize="large" />
                </div>
              </button>
            </Tooltip>
            <Tooltip placement="top" title="Vote for NO">
              <button
                onClick={() => onClickVoteOnProposal(VoteOption.No)}
                className="mr-4"
                disabled={!isVotingEnabled}
              >
                <div
                  className={cn(
                    "flex flex-row items-center justify-center w-14 h-14 bg-red-500 rounded-lg",
                    hasVotingPower && isVotingEnabled
                      ? "cursor-pointer"
                      : "cursor-not-allowed",
                  )}
                >
                  <ThumbDown fontSize="large" />
                </div>
              </button>
            </Tooltip>
            <Tooltip placement="top" title="Vote for ABSTAIN">
              <button
                onClick={() => onClickVoteOnProposal(VoteOption.Abstain)}
                disabled={!isVotingEnabled}
              >
                <div
                  className={cn(
                    "flex flex-row items-center justify-center w-14 h-14 bg-yellow-400 rounded-lg",
                    hasVotingPower && isVotingEnabled
                      ? "cursor-pointer"
                      : "cursor-not-allowed",
                  )}
                >
                  <AcUnitIcon fontSize="large" />
                </div>
              </button>
            </Tooltip>
          </div>
        </div>

        <div>{statusRenderer[status]}</div>

        {shouldRenderFees && (
          <ul className="space-y-4 text-gray-400 text-sm mt-6 w-max">
            <li>
              <Tooltip
                placement="right"
                title="Equito Network source chain fee"
              >
                <div className="flex flex-row items-center">
                  <span className="mr-2">Source Chain Fee: </span>
                  {isPendingSourceFee ? (
                    <FeeSkeleton />
                  ) : (
                    formattedSourceChainFee
                  )}
                </div>
              </Tooltip>
            </li>
            <li>
              <Tooltip
                placement="right"
                title="Equito Network destination chain fee"
              >
                <div className="flex flex-row items-center">
                  <span className="mr-2">Destination Chain Fee:</span>
                  {isPendingDestinationFee ? (
                    <FeeSkeleton />
                  ) : (
                    formattedDestinationChainFee
                  )}
                </div>
              </Tooltip>
            </li>
            <li>
              <Tooltip
                placement="right"
                title="Equito Vote Protocol fee for voting on proposals"
              >
                <div className="flex flex-row items-center">
                  <span className="mr-2">Equito Voting Fee</span>
                  {isPendingVoteOnProposalFee ? (
                    <FeeSkeleton />
                  ) : (
                    formattedCreateProposalFee
                  )}
                </div>
              </Tooltip>
            </li>
            <li>
              <Tooltip placement="right" title="Total fee across both chains">
                <div className="flex flex-row items-center">
                  <span className="mr-2">Total Cross Chain Fee:</span>
                  {isPendingSourceFee ||
                  isPendingDestinationFee ||
                  isPendingVoteOnProposalFee ? (
                    <FeeSkeleton />
                  ) : (
                    formattedTotalUserFee
                  )}
                </div>
              </Tooltip>
            </li>
          </ul>
        )}

        {shouldRenderLackVotingPower && (
          <div className="mt-4 italic">
            You must have voting power in {activeProposal.tokenName} tokens to
            be able to vote.{" "}
            {!userTokenBalance && (
              <>
                Get tokens from the{" "}
                <Link
                  href="/faucet"
                  className="underline hover:text-blue-300 transition-colors"
                >
                  Faucet
                </Link>
                .
              </>
            )}
            {shouldRenderDelegation && "Please delegate your balance."}
          </div>
        )}

        {shouldRenderDelegation && (
          <div className="mt-4">
            <Button
              onClick={onClickDelegate}
              isDisabled={!tokenAddress || isDelegating}
            >
              Delegate Balance
            </Button>
            {isDelegating && (
              <div className="flex flex-row items-center mt-4">
                <div>
                  <CircularProgress size={20} />
                </div>
                <div className="ml-4">Delegation in Progress</div>
              </div>
            )}
          </div>
        )}

        {shouldRenderDecision && (
          <div className="mt-4 italic">
            This proposal has concluded. Final decision was: {decision}.
          </div>
        )}

        {shouldRenderExistingVotes && (
          <div className="mt-4 italic">
            You've voted with {activeAmountUserVotes} {activeProposal.tokenName}{" "}
            token
            {Number(activeAmountUserVotes) !== 1 ? "s" : ""} on this proposal.
          </div>
        )}
      </div>
    </div>
  );
}
