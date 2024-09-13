"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { addHours } from "date-fns";
import { useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { getBlock, waitForTransactionReceipt } from "@wagmi/core";
import { Address, formatUnits, parseEventLogs } from "viem";
import { routerAbi } from "@equito-sdk/evm";
import { generateHash } from "@equito-sdk/viem";
import { CircularProgress, MenuItem, TextField } from "@mui/material";
import { config } from "@/utils/wagmi";
import { useApprove } from "@/hooks/use-approve";
import { useDeliver } from "@/hooks/use-deliver";
import { Status } from "@/types";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Chain } from "@/utils/chains";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";
import { Button } from "@/components/button";

const equitoVoteAbi = equitoVote.abi;

enum FormKeys {
  title = "title",
  description = "description",
  durationHours = "durationHours",
  tokenName = "tokenName",
}

interface FormData {
  [FormKeys.title]: string;
  [FormKeys.description]: string;
  [FormKeys.durationHours]: string;
  [FormKeys.tokenName]: string;
}

interface OptionString {
  label?: string | undefined;
  value?: string | undefined;
}

interface CreateProposalArgs {
  destinationChainSelector: number;
  endTimestamp: number;
  title: string;
  description: string;
  tokenName?: string;
  originChainSelector?: number;
}

const defaultFormData: FormData = {
  [FormKeys.title]: "",
  [FormKeys.description]: "",
  [FormKeys.durationHours]: "",
  [FormKeys.tokenName]: "",
};

const formLabels: FormData = {
  [FormKeys.title]: "Title",
  [FormKeys.description]: "Description",
  [FormKeys.durationHours]: "Duration in Hours",
  [FormKeys.tokenName]: "Token Name",
};

const formErrorMessages: FormData = {
  title: "Please enter a title",
  description: "Please enter a description",
  durationHours: "Duration must be equal or greather than 1 hour",
  tokenName: "Please select a token",
};

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
    endTimestamp: endTimestamp,
    title: formData.title,
    description: formData.description,
    tokenName: formData.tokenName,
    originChainSelector: sourceChain.chainSelector,
  };
}

export default function CreateProposalPage() {
  const [status, setStatus] = useState<Status>(Status.IsStart);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Set<FormKeys>>(new Set());

  const proposalTitleRef = useRef<HTMLInputElement>(null);

  const { writeContractAsync } = useWriteContract();

  const { switchChainAsync } = useSwitchChain();

  const { sourceChain, sourceRouter, destinationRouter, destinationChain } =
    useEquitoVote();

  const sourceRouterAddress = sourceRouter?.data;
  const destinationRouterAddress = destinationRouter?.data;

  const approve = useApprove();

  const deliverMessage = useDeliver({
    equito: {
      chain: destinationChain,
      router: destinationRouter,
    },
  });

  const { data: sourceFee } = useReadContract({
    address: sourceRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [sourceChain?.equitoVoteContractV2 as Address],
    query: { enabled: !!sourceRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: destinationFee } = useReadContract({
    address: destinationRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [destinationChain.equitoVoteContractV2 as Address],
    query: { enabled: !!destinationRouterAddress },
    chainId: destinationChain.definition.id,
  });

  const { data: createProposalFee } = useReadContract({
    address: sourceChain?.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "protocolFee",
    query: { enabled: !!sourceRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: tokenNamesLength } = useReadContract({
    address: destinationChain.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "getTokenNamesLength",
    chainId: destinationChain.definition.id,
  });

  const { data: tokenNamesData, isPending: isPendingTokenNames } =
    useReadContract({
      address: destinationChain.equitoVoteContractV2,
      abi: equitoVoteAbi,
      functionName: "getTokenNamesSlice",
      args: [0, tokenNamesLength],
      query: { enabled: !!tokenNamesLength },
      chainId: destinationChain.definition.id,
    });
  const tokenNames = tokenNamesData as string[] | undefined;

  const formattedSourceChainFee = sourceFee
    ? `${Number(formatUnits(sourceFee, 18)).toFixed(8)} ${
        sourceChain?.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  const formattedDestinationChainFee = destinationFee
    ? `${Number(formatUnits(destinationFee, 18)).toFixed(8)} ${
        destinationChain.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  const formattedCreateProposalFee = createProposalFee
    ? `${Number(formatUnits(createProposalFee as bigint, 18)).toFixed(8)} ${
        sourceChain?.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  const totalCreateProposalFee =
    sourceFee && createProposalFee
      ? sourceFee + (createProposalFee as bigint)
      : BigInt(0);

  const tokenNamesOption = useMemo(
    () => tokenNames?.map((name) => ({ value: name, label: name })),
    [tokenNames],
  );

  useEffect(() => {
    proposalTitleRef.current?.focus();
  }, []);

  const createProposal = async () => {
    const hash = await writeContractAsync({
      address: sourceChain.equitoVoteContractV2 as Address,
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
      await switchChainAsync({ chainId: sourceChain.definition.id });
      const createProposalReceipt = await createProposal();

      const logs = parseEventLogs({
        abi: routerAbi,
        logs: createProposalReceipt.logs,
      });

      console.log("logs");
      console.log(logs);

      const sendMessageResult = parseEventLogs({
        abi: routerAbi,
        logs: createProposalReceipt.logs,
      }).flatMap(({ eventName, args }) =>
        eventName === "MessageSendRequested" ? [args] : [],
      )[0];

      console.log("sendMessageResult");
      console.log(sendMessageResult);

      setStatus(Status.IsRetrievingBlockOnSourceChain);
      const { timestamp: sendMessageTimestamp } = await getBlock(config, {
        chainId: sourceChain?.definition.id,
        blockNumber: createProposalReceipt.blockNumber,
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
    } catch (error) {
      setStatus(Status.IsRetry);
      console.log(error);
    }
  };

  const CreateProposalButton = ({ cta }: { cta: string }) => (
    <Button onClick={onClickCreateProposal}>SUBMIT PROPOSAL</Button>
  );

  const statusRenderer = {
    [Status.IsStart]: <CreateProposalButton cta="Create Proposal" />,
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
    [Status.IsRetry]: <CreateProposalButton cta="Retry" />,
  };

  return (
    <div className="ml-16">
      <h2 className="mb-8 text-xl font-semibold">Create New Proposal</h2>
      <div className="mb-4 flex flex-row items-center">
        <TextField
          id={FormKeys.tokenName}
          select
          label={formLabels.tokenName}
          disabled={isPendingTokenNames}
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
          {(tokenNamesOption || []).map((option: OptionString) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        {isPendingTokenNames && (
          <div className="ml-8">
            <CircularProgress size={30} />
          </div>
        )}
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

      <div className="mb-6">
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
            formErrors.has(FormKeys.title) ? formErrorMessages.title : undefined
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
          sx={{ width: "350px" }}
          value={formData.durationHours}
          onChange={(e) => {
            const value = e.target.value;
            const updatedFormErrors = new Set(formErrors);
            if (!isDurationValid(value)) {
              updatedFormErrors.add(FormKeys.durationHours);
              setFormErrors(updatedFormErrors);
            } else {
              updatedFormErrors.delete(FormKeys.durationHours);
              setFormErrors(updatedFormErrors);
            }
            setFormData({ ...formData, durationHours: value });
          }}
          error={formErrors.has(FormKeys.durationHours)}
          helperText={
            formErrors.has(FormKeys.durationHours)
              ? formErrorMessages.durationHours
              : undefined
          }
        />
      </div>

      {/* Equito messaging fee */}
      <div>source chain fee: {formattedSourceChainFee}</div>
      <div>destination chain fee: {formattedDestinationChainFee}</div>

      {/* Creating a proposal fee */}
      <div>
        EquitoVote fee: {formattedCreateProposalFee} (fee is only charged on
        proposal creation)
      </div>

      {statusRenderer[status]}
    </div>
  );
}
