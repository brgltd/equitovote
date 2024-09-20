"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { addHours } from "date-fns";
import { useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { getBlock, waitForTransactionReceipt } from "@wagmi/core";
import { Address, formatUnits, parseEventLogs } from "viem";
import { routerAbi } from "@equito-sdk/evm";
import { generateHash } from "@equito-sdk/viem";
import { config } from "@/utils/wagmi";
import { useApprove } from "@/hooks/use-approve";
import { useDeliver } from "@/hooks/use-deliver";
import { Status } from "@/types";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Chain } from "@/utils/chains";
import { CircularProgress, MenuItem, TextField, Tooltip } from "@mui/material";
import { Button } from "@/components/button";
import { FeeSkeleton } from "@/components/fee-skeleton";
import { isArrayNotEmpty, isValidData } from "@/utils/helpers";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";

const equitoVoteAbi = equitoVote.abi;

enum FormKeys {
  title = "title",
  description = "description",
  durationHours = "durationHours",
  tokenName = "tokenName",
}

interface FormData {
  title: string;
  description: string;
  durationHours: string;
  tokenName: string;
}

const defaultFormData: FormData = {
  title: "",
  description: "",
  durationHours: "",
  tokenName: "",
};

const formLabels: FormData = {
  title: "Title",
  description: "Description",
  durationHours: "Duration in Hours",
  tokenName: "Token Name",
};

const formErrorMessages: FormData = {
  title: "Please enter a title",
  description: "Please enter a description",
  durationHours: "Duration must be equal or greather than 1 hour",
  tokenName: "Please select a token",
};

interface OptionString {
  label: string;
  value: string;
}

interface CreateProposalArgs {
  destinationChainSelector: number;
  endTimestamp: number;
  title: string;
  description: string;
  tokenName?: string;
  originChainSelector?: number;
}

function isDurationValid(duration: string) {
  return Number(duration) >= 1;
}

function buildCreateProposalArgs(
  formData: FormData,
  destinationChain: Chain,
  sourceChain: Chain,
): CreateProposalArgs {
  const endTimestamp = Math.floor(
    addHours(new Date(), Number(formData.durationHours)).getTime() / 1000,
  );
  return {
    destinationChainSelector: destinationChain.chainSelector,
    originChainSelector: sourceChain.chainSelector,
    endTimestamp: endTimestamp,
    title: formData.title,
    description: formData.description,
    tokenName: formData.tokenName,
  };
}

function buildSlicedTokenNamesArgs(tokenNamesLength: bigint) {
  const max = 10;
  const tokenNamesLengthNumber = Number(tokenNamesLength);
  return tokenNamesLengthNumber <= max
    ? [0, tokenNamesLengthNumber]
    : [tokenNamesLengthNumber - max, tokenNamesLengthNumber];
}

function SelectEmpty() {
  return (
    <MenuItem key="token-names-empty" value="token-names-empty">
      No tokens available
    </MenuItem>
  );
}

export default function CreateProposalPage() {
  const [status, setStatus] = useState<Status>(Status.IsStart);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Set<FormKeys>>(new Set());
  const [proposalId, setProposalId] = useState<string>("");

  const { writeContractAsync } = useWriteContract();

  const { switchChainAsync } = useSwitchChain();

  const {
    sourceChain,
    sourceRouter,
    destinationRouter,
    destinationChain,
    handleError,
  } = useEquitoVote();

  const sourceRouterAddress = sourceRouter?.data;
  const destinationRouterAddress = destinationRouter?.data;

  const approve = useApprove();

  const deliverMessage = useDeliver({
    equito: {
      chain: destinationChain,
      router: destinationRouter,
    },
  });

  const { data: sourceFee, isPending: isPendingSourceFee } = useReadContract({
    address: sourceRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [sourceChain?.equitoVoteContract as Address],
    query: { enabled: !!sourceRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: destinationFee, isPending: isPendingDestinationFee } =
    useReadContract({
      address: destinationRouterAddress,
      abi: routerAbi,
      functionName: "getFee",
      args: [destinationChain.equitoVoteContract as Address],
      query: { enabled: !!destinationRouterAddress },
      chainId: destinationChain.definition.id,
    });

  const { data: createProposalFeeData, isPending: isPendingCreateProposalFee } =
    useReadContract({
      address: sourceChain?.equitoVoteContract,
      abi: equitoVoteAbi,
      functionName: "createProposalFee",
      query: { enabled: !!sourceRouterAddress },
      chainId: sourceChain?.definition.id,
    });
  const createProposalFee = createProposalFeeData as bigint;

  const { data: tokenNamesLength } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "getTokenNamesLength",
    chainId: destinationChain.definition.id,
  });

  const { data: tokenNamesData, isPending: isPendingTokenNames } =
    useReadContract({
      address: destinationChain.equitoVoteContract,
      abi: equitoVoteAbi,
      functionName: "getSlicedTokenNames",
      args: buildSlicedTokenNamesArgs(tokenNamesLength as bigint),
      query: { enabled: isValidData(tokenNamesLength) },
      chainId: destinationChain.definition.id,
    });
  const tokenNames = tokenNamesData as string[] | undefined;

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

  const formattedCreateProposalFee = !!createProposalFee
    ? `${Number(formatUnits(createProposalFee, 18)).toFixed(8)} ${
        sourceChain?.definition?.nativeCurrency?.symbol
      }`
    : "Unavailable";

  const formattedTotalUserFee =
    !!sourceFee && !!destinationFee && !!createProposalFee
      ? `${Number(formatUnits(sourceFee + destinationFee + createProposalFee, 18)).toFixed(8)} ${
          sourceChain?.definition?.nativeCurrency?.symbol
        }`
      : "Unavailable";

  const totalCreateProposalFee =
    !!sourceFee && !!createProposalFee
      ? sourceFee + createProposalFee
      : BigInt(0);

  const isPendingData =
    isPendingSourceFee ||
    isPendingDestinationFee ||
    isPendingCreateProposalFee ||
    isPendingTokenNames;

  const isOperationReady =
    status === Status.IsStart ||
    status === Status.IsCompleted ||
    status === Status.IsRetry;

  const isCreateProposalEnabled = isOperationReady && !isPendingData;

  const tokenNamesOption = useMemo(
    () => tokenNames?.map((name) => ({ value: name, label: name })),
    [tokenNames],
  );

  const createProposal = async () => {
    const hash = await writeContractAsync({
      address: sourceChain.equitoVoteContract as Address,
      abi: equitoVoteAbi,
      functionName: "createProposal",
      args: Object.values(
        buildCreateProposalArgs(formData, destinationChain, sourceChain),
      ),
      value: totalCreateProposalFee,
      chainId: sourceChain?.definition.id,
    });
    return waitForTransactionReceipt(config, {
      hash,
      chainId: sourceChain?.definition.id,
    });
  };

  const onClickCreateProposal = async () => {
    if (!Object.values(formData).every(Boolean)) {
      const updatedFormErrors: Set<FormKeys> = new Set();
      if (!formData.tokenName) {
        updatedFormErrors.add(FormKeys.tokenName);
      }
      if (!formData.title) {
        updatedFormErrors.add(FormKeys.title);
      }
      if (!formData.description) {
        updatedFormErrors.add(FormKeys.description);
      }
      if (!isDurationValid(formData.durationHours)) {
        updatedFormErrors.add(FormKeys.durationHours);
      }
      setFormErrors(updatedFormErrors);
      return;
    }
    setStatus(Status.IsExecutingBaseTxOnSourceChain);
    try {
      const initialChain = sourceChain;

      await switchChainAsync({ chainId: sourceChain?.definition?.id });
      const createProposalReceipt = await createProposal();

      const proposalId =
        createProposalReceipt?.logs?.[createProposalReceipt?.logs?.length - 1]
          ?.topics?.[1];

      setProposalId(proposalId || "");

      const sendMessageResult = parseEventLogs({
        abi: routerAbi,
        logs: createProposalReceipt.logs,
      }).flatMap(({ eventName, args }) =>
        eventName === "MessageSendRequested" ? [args] : [],
      )[0];

      setStatus(Status.IsRetrievingBlockOnSourceChain);
      const { timestamp: sendMessageTimestamp } = await getBlock(config, {
        chainId: sourceChain?.definition.id,
        blockNumber: createProposalReceipt.blockNumber,
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

      setStatus(Status.IsCompleted);

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
        <div className="ml-4">Creating Proposal on Source Chain</div>
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
    // Toast will be displayed on errors.
    [Status.IsRetry]: <></>,
    [Status.IsCompleted]: (
      <div className="mt-4">
        <span className="mr-2">Proposal Created Successfully.</span>
        <Link
          // We should have proposalId from the event logs and the link
          // should point to the new proposal page.
          // But in any case if we don't, then link goes to homepage
          // where the newly created proposal would be on the top.
          href={proposalId ? `/vote/${proposalId}` : "/"}
          className="underline hover:text-blue-300 transition-colors"
        >
          Open Proposal{proposalId ? "" : "s"}
        </Link>
        .
      </div>
    ),
  };

  return (
    <div>
      <div>
        <h1 className="mb-8 text-xl font-semibold">Create New Proposal</h1>
        <div className="flex flex-col md:flex-row mb-8">
          <div className="md:mr-16">
            <div className="mb-4 flex flex-row items-center">
              <TextField
                id={FormKeys.tokenName}
                select
                label={formLabels.tokenName}
                value={formData.tokenName}
                onChange={(e) => {
                  const updatedFormErrors = new Set(formErrors);
                  updatedFormErrors.delete(FormKeys.tokenName);
                  setFormErrors(updatedFormErrors);
                  setFormData({ ...formData, tokenName: e.target.value });
                }}
                error={formErrors.has(FormKeys.tokenName)}
                helperText={
                  formErrors.has(FormKeys.tokenName)
                    ? formErrorMessages.tokenName
                    : undefined
                }
                sx={{ width: "350px" }}
              >
                {isPendingTokenNames ? (
                  <div className="flex flex-row items-center justify-center">
                    <MenuItem
                      key="token-names-loading"
                      value="token-names-loading"
                    >
                      <CircularProgress />
                    </MenuItem>
                  </div>
                ) : !isArrayNotEmpty(tokenNamesOption as OptionString[]) ? (
                  <SelectEmpty />
                ) : (
                  (tokenNamesOption || []).map((option: OptionString) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))
                )}
              </TextField>
            </div>
            <div className="mb-8">
              You DAO token not present?{" "}
              <Link
                href="add-new-token"
                className="underline hover:text-blue-300 transition-colors"
              >
                Add New Token
              </Link>
            </div>

            <div className="mb-8">
              <TextField
                id={FormKeys.title}
                label={formLabels.title}
                value={formData.title}
                onChange={(e) => {
                  const updatedFormErrors = new Set(formErrors);
                  updatedFormErrors.delete(FormKeys.title);
                  setFormErrors(updatedFormErrors);
                  setFormData({ ...formData, title: e.target.value });
                }}
                error={formErrors.has(FormKeys.title)}
                helperText={
                  formErrors.has(FormKeys.title)
                    ? formErrorMessages.title
                    : undefined
                }
                sx={{ width: "350px" }}
              />
            </div>

            <div className="mb-8">
              <TextField
                id={FormKeys.description}
                label={formLabels.description}
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => {
                  const updatedFormErrors = new Set(formErrors);
                  updatedFormErrors.delete(FormKeys.description);
                  setFormErrors(updatedFormErrors);
                  setFormData({ ...formData, description: e.target.value });
                }}
                error={formErrors.has(FormKeys.description)}
                helperText={
                  formErrors.has(FormKeys.description)
                    ? formErrorMessages.description
                    : undefined
                }
                sx={{ width: "350px" }}
              />
            </div>

            <div>
              <TextField
                id={FormKeys.durationHours}
                label={formLabels.durationHours}
                type="number"
                value={formData.durationHours}
                onChange={(e) => {
                  const durationHours = e.target.value;
                  const updatedFormErrors = new Set(formErrors);
                  if (!isDurationValid(durationHours)) {
                    updatedFormErrors.add(FormKeys.durationHours);
                    setFormErrors(updatedFormErrors);
                  } else {
                    updatedFormErrors.delete(FormKeys.durationHours);
                    setFormErrors(updatedFormErrors);
                  }
                  setFormData({ ...formData, durationHours: durationHours });
                }}
                error={formErrors.has(FormKeys.durationHours)}
                helperText={
                  formErrors.has(FormKeys.durationHours)
                    ? formErrorMessages.durationHours
                    : undefined
                }
                sx={{ width: "350px" }}
              />
            </div>
          </div>

          <ul className="space-y-4 text-gray-400 text-sm md:mt-0 mt-8">
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
                title="Equito Vote Protocol fee for creating proposals"
              >
                <div className="flex flex-row items-center">
                  <span className="mr-2">Create Proposal Fee:</span>
                  {isPendingCreateProposalFee ? (
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
                  isPendingCreateProposalFee ? (
                    <FeeSkeleton />
                  ) : (
                    formattedTotalUserFee
                  )}
                </div>
              </Tooltip>
            </li>
          </ul>
        </div>
        <Button
          onClick={onClickCreateProposal}
          isDisabled={!isCreateProposalEnabled}
        >
          SUBMIT PROPOSAL
        </Button>
        {statusRenderer[status]}
      </div>
    </div>
  );
}
