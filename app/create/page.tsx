"use client";

import { useEffect, useRef, useState } from "react";
import { addHours } from "date-fns";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { getBlock, waitForTransactionReceipt } from "@wagmi/core";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { routerAbi } from "@equito-sdk/evm";
import { useRouter } from "@/hooks/use-router";
import { Address, formatUnits, parseEventLogs } from "viem";
import { arbitrumChain, Chain } from "@/utils/chains";
import { config } from "@/utils/wagmi";
import { ChainSelect } from "@/components/chain-select";
import { useApprove } from "@/hooks/use-approve";
import { generateHash } from "@equito-sdk/viem";
import { useDeliver } from "@/hooks/use-deliver";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";

const equitoVoteAbi = equitoVote.abi;

const destinationChain = arbitrumChain;

enum Status {
  IsStart = "IS_START",
  IsCallingCreateProposalSourceChain = "IS_CALLING_CREATE_PROPOSAL_SOURCE_CHAIN",
  IsRetrievingBlockSourceChain = "IS_RETRIEVING_BLOCK_SOURCE_CHAIN",
  IsGeneratingProofSourceChain = "IS_GENERATING_PROOF_SOURCE_CHAIN",
  IsExecutingMessageDestinationChain = "IS_EXECUTING_MESSAGE_DESTINATION_CHAIN",
  IsRetry = "IS_RETRY",
}

interface FormData {
  title: string;
  description: string;
  durationHours: string;
  token: string;
}

interface CreateProposalArgs {
  destinationChainSelector: number;
  endTimestamp: number;
  erc20: string;
  title: string;
  description: string;
}

const defaultFormData: FormData = {
  title: "",
  description: "",
  durationHours: "",
  token: "",
};

function buildCreateProposalArgs(formData: FormData): CreateProposalArgs {
  const endTimestamp = Math.floor(
    addHours(new Date(), Number(formData.durationHours)).getTime() / 1000,
  );
  return {
    destinationChainSelector: destinationChain.chainSelector,
    endTimestamp: endTimestamp,
    erc20: formData.token,
    title: formData.title,
    description: formData.description,
  };
}

// @ts-ignore
function normalizeResponse(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((item) =>
    Object.entries(item).reduce((acc, [key, value]) => {
      if (typeof value == "bigint") {
        // @ts-ignore
        acc[key] = Number(value);
      } else {
        // @ts-ignore
        acc[key] = value;
      }
      return acc;
    }, {}),
  );
}

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [status, setStatus] = useState<Status>(Status.IsStart);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [sourceChain, setSourceChain] = useState<Chain>(null!);

  const proposalTitleRef = useRef<HTMLInputElement>(null);

  const { writeContractAsync } = useWriteContract();

  const { switchChainAsync } = useSwitchChain();

  const { address: userAddress } = useAccount();

  const fromRouter = useRouter({ chainSelector: sourceChain?.chainSelector });
  const fromRouterAddress = fromRouter?.data;
  const toRouter = useRouter({ chainSelector: destinationChain.chainSelector });
  const toRouterAddress = toRouter?.data;

  const approve = useApprove();

  const deliverMessage = useDeliver({
    equito: {
      chain: destinationChain,
      router: toRouter,
    },
  });

  const { data: fromFee } = useReadContract({
    address: fromRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [sourceChain?.equitoVoteContract as Address],
    query: { enabled: !!fromRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: toFee } = useReadContract({
    address: toRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [destinationChain.equitoVoteContract as Address],
    query: { enabled: !!toRouterAddress },
    chainId: destinationChain.definition.id,
  });

  const { data: createProposalFee } = useReadContract({
    address: sourceChain?.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "protocolFee",
    query: { enabled: !!fromRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const formattedSourceChainFee = fromFee
    ? `${Number(formatUnits(fromFee, 18)).toFixed(8)} ${
        sourceChain?.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  const formattedDestinationChainFee = toFee
    ? `${Number(formatUnits(toFee, 18)).toFixed(8)} ${
        destinationChain.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  const formattedCreateProposalFee = createProposalFee
    ? `${Number(formatUnits(createProposalFee as bigint, 18)).toFixed(8)} ${
        sourceChain?.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  const { data: proposalsLength } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "getProposalIdsLength",
    chainId: destinationChain.definition.id,
  });

  const { data: proposals } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "getProposalsSlice",
    args: [BigInt(0), proposalsLength],
    query: { enabled: !!proposalsLength },
    chainId: destinationChain.definition.id,
  });

  // console.log("proposals");
  // console.log(proposals);
  const normalizedProposals = normalizeResponse(proposals);

  const { data: p0 } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "proposals",
    args: [
      "0x5580f5d26e36f4717bd94ddf3b0060ed881187cebd816e6726e0df81562fa586",
    ],
    chainId: destinationChain.definition.id,
  });

  const totalCreateProposalFee =
    fromFee && createProposalFee
      ? fromFee + (createProposalFee as bigint)
      : BigInt(0);

  useEffect(() => {
    proposalTitleRef.current?.focus();
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const createProposal = async () => {
    const hash = await writeContractAsync({
      address: sourceChain.equitoVoteContract as Address,
      abi: equitoVoteAbi,
      functionName: "createProposal",
      args: Object.values(buildCreateProposalArgs(formData)),
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
      setStatus(Status.IsCallingCreateProposalSourceChain);
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

      setStatus(Status.IsRetrievingBlockSourceChain);
      const { timestamp: sendMessageTimestamp } = await getBlock(config, {
        chainId: sourceChain?.definition.id,
        blockNumber: createProposalReceipt.blockNumber,
      });

      setStatus(Status.IsGeneratingProofSourceChain);
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

      setStatus(Status.IsExecutingMessageDestinationChain);
      const executionReceipt = await deliverMessage.execute(
        sendMessageProof,
        sendMessageResult.message,
        sendMessageResult.messageData,
        toFee,
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

  const statusRenderer = {
    [Status.IsStart]: (
      <button onClick={onClickCreateProposal}>Create Proposal</button>
    ),
    [Status.IsCallingCreateProposalSourceChain]: (
      <div>creating proposal on source chain</div>
    ),
    [Status.IsRetrievingBlockSourceChain]: (
      <div>is retriving block from source chain</div>
    ),
    [Status.IsGeneratingProofSourceChain]: (
      <div>generating proof source chai</div>
    ),
    [Status.IsExecutingMessageDestinationChain]: (
      <div>executing message on destination chain</div>
    ),
    [Status.IsRetry]: <button onClick={onClickCreateProposal}>Retry</button>,
  };

  return (
    <div>
      <ConnectButton
        chainStatus="none"
        showBalance={false}
        accountStatus={{
          smallScreen: "avatar",
          largeScreen: "full",
        }}
      />
      {isClient && userAddress ? `address: ${userAddress}` : "not connected"}

      <hr />
      <div>create proposal section</div>

      <ChainSelect setSourceChain={setSourceChain} />

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

      <div>
        <label htmlFor="token">ERC20 Token Address</label>
        <input
          id="token"
          value={formData.token}
          onChange={(e) => setFormData({ ...formData, token: e.target.value })}
          className="text-black"
        />
      </div>

      {statusRenderer[status]}

      {/* Equito messaging fee */}
      <div>source chain fee: {formattedSourceChainFee}</div>
      <div>destination chain fee: {formattedDestinationChainFee}</div>

      {/* Creating a proposal fee */}
      <div>
        EquitoVote fee: {formattedCreateProposalFee} (fee is only charged on
        proposal creation)
      </div>

      <hr />

      <div>list of proposals section</div>
      <div>{JSON.stringify(normalizedProposals, null, 4) || "Empty"}</div>

      <hr />
    </div>
  );
}
