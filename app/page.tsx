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
import { formatUnits, parseEventLogs } from "viem";
import { Addresses } from "@/addresses";
import { arbitrumChain, Chain } from "@/utils/chains";
import { config } from "@/utils/wagmi";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import healthcheckContract from "@/out/Healthcheck.sol/Healthcheck.json";
import { ChainSelect } from "@/components/chain-select";
import { useApprove } from "@/hooks/use-approve";
import { generateHash } from "@equito-sdk/viem";
import { useDeliver } from "@/hooks/use-deliver";

const equitoVoteAbi = equitoVote.abi;
const healthcheckAbi = healthcheckContract.abi;

enum Status {
  IsStart = "IS_START",
  IsCreatingProposal = "IS_CREATING_PROPOSAL",
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
    destinationChainSelector: arbitrumChain.chainSelector,
    endTimestamp: endTimestamp,
    erc20: formData.token,
    title: formData.title,
    description: formData.description,
  };
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
  const toRouter = useRouter({ chainSelector: arbitrumChain.chainSelector });
  const toRouterAddress = toRouter.data;

  const approve = useApprove();

  const deliverMessage = useDeliver({
    equito: {
      chain: arbitrumChain,
      router: toRouter,
    },
  });

  const { data: fromFee } = useReadContract({
    address: fromRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [Addresses.Healthcheck_EthereumSepolia_V1],
    query: { enabled: !!fromRouterAddress },
    chainId: sourceChain?.definition.id,
  });

  const { data: toFee } = useReadContract({
    address: toRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [Addresses.Healthcheck_ArbitrumSepolia_V1],
    query: { enabled: !!toRouterAddress },
    chainId: arbitrumChain?.definition.id,
  });

  const { data: createProposalFee } = useReadContract({
    // TODO: replace this with EquitoVote address
    address: Addresses.Healthcheck_EthereumSepolia_V1,
    // TODO: replace this with EquitoVote abi
    abi: healthcheckAbi,
    functionName: "propocolFee",
    chainId: sourceChain?.definition.id,
  });

  // TODO: will nee to parseUnits when calling the real thing
  const parsedCreateProposalFee = (createProposalFee as any) || 0.01;

  const sourceChainCoinSymbol = sourceChain?.definition?.nativeCurrency?.symbol;

  const parsedFromFee = fromFee
    ? `${Number(formatUnits(fromFee, 18)).toFixed(8)} ${
        sourceChain?.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  const parsedToFee = toFee
    ? `${Number(formatUnits(toFee, 18)).toFixed(8)} ${
        arbitrumChain?.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  useEffect(() => {
    proposalTitleRef.current?.focus();
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const createProposal = async () => {
    const hash = await writeContractAsync({
      address: Addresses.EquitoVote_EthereumSepolia_V1,
      abi: equitoVoteAbi,
      functionName: "createProposal",
      args: Object.values(buildCreateProposalArgs(formData)),
      // TODO: add equito fee + equitoVote fee
      value: BigInt(0),
      chainId: sourceChain?.definition.id,
    });
    return waitForTransactionReceipt(config, {
      hash,
      chainId: sourceChain?.definition.id,
    });
  };

  const onClickCreateProposal = async () => {
    try {
      setStatus(Status.IsCreatingProposal);

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

      const { timestamp: sendMessageTimestamp } = await getBlock(config, {
        chainId: sourceChain?.definition.id,
        blockNumber: createProposalReceipt.blockNumber,
      });

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
    } catch (error) {
      // TODO: show a toast with the error
      console.error(error);
    }
  };

  const statusRenderer = {
    [Status.IsStart]: (
      <button onClick={onClickCreateProposal}>Create Proposal</button>
    ),
    [Status.IsCreatingProposal]: <div>loading</div>,
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

      {/* TODO: possibly should show these two as a sum */}
      {/* Equito messaging fee */}
      <div>source chain fee: {parsedFromFee}</div>
      <div>destination chain fee: {parsedToFee}</div>

      {/* Creating a proposal fee */}
      <div>
        EquitoVote fee: {parsedCreateProposalFee} {sourceChainCoinSymbol} (fee
        is only charged on proposal creation)
      </div>

      <hr />
    </div>
  );
}
