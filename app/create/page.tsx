"use client";

import { useEffect, useRef, useState } from "react";
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
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";
import Link from "next/link";

const tokenNamesMock = ["EquitoHackathon"];

const equitoVoteAbi = equitoVote.abi;

interface FormData {
  title: string;
  description: string;
  durationHours: string;
  tokenName: string;
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
  title: "",
  description: "",
  durationHours: "",
  tokenName: "",
};

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

export default function HomePage() {
  const [status, setStatus] = useState<Status>(Status.IsStart);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

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
    args: [sourceChain?.equitoVoteContract as Address],
    query: { enabled: !!sourceRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: destinationFee } = useReadContract({
    address: destinationRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [destinationChain.equitoVoteContract as Address],
    query: { enabled: !!destinationRouterAddress },
    chainId: destinationChain.definition.id,
  });

  const { data: createProposalFee } = useReadContract({
    address: sourceChain?.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "protocolFee",
    query: { enabled: !!sourceRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: tokensNamesData } = useReadContract({
    address: destinationChain?.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "tokenNames",
    chainId: destinationChain.definition.id,
  });
  // const tokenNames = tokensNamesData as string[] | undefined;
  const tokenNames = tokenNamesMock;

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

  useEffect(() => {
    proposalTitleRef.current?.focus();
  }, []);

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
    try {
      setStatus(Status.IsExecutingBaseTxOnSourceChain);
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
    <button
      onClick={onClickCreateProposal}
      disabled={!Object.values(formData).every(Boolean) || !sourceChain}
    >
      {cta}
    </button>
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
    <div>
      <div>
        <select
          value={formData.tokenName}
          onChange={(e) =>
            setFormData({ ...formData, tokenName: e.target.value })
          }
        >
          <option value="">Select an option</option>
          {tokenNames?.map((tokenName) => (
            <option key={tokenName} value={tokenName}>
              {tokenName}
            </option>
          ))}
        </select>
        <div>
          <span>Your DAO token not present?</span>
          <Link href="/set-token-data">Add New Token</Link>
        </div>
      </div>

      <div>
        <label htmlFor="title">title</label>
        <input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          ref={proposalTitleRef}
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="description">description</label>
        <input
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="duration">duration in hours</label>
        <input
          type="number"
          id="duration"
          value={formData.durationHours}
          onChange={(e) =>
            setFormData({ ...formData, durationHours: e.target.value })
          }
          className="text-black"
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
