"use client";

import { useEffect, useRef, useState } from "react";
import { addHours } from "date-fns";
import {
  useAccount,
  useReadContract,
  useSwitchChain,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { routerAbi } from "@equito-sdk/evm";
import { useRouter } from "@/hooks/use-router";
import { formatUnits } from "viem";
import { Addresses } from "@/addresses";
import { chains } from "@/utils/chains";
import { config } from "@/utils/wagmi";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import healthcheckContract from "@/out/Healthcheck.sol/Healthcheck.json";

const equitoVoteAbi = equitoVote.abi;
const healthcheckAbi = healthcheckContract.abi;

const ARBITRUM_CHAIN_SELECTOR = 1004;

const ethereumChain = chains.find((chain) => chain.name === "Ethereum Sepolia");
const arbitrumChain = chains.find((chain) => chain.name === "Arbitrum Sepolia");

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
    destinationChainSelector: ARBITRUM_CHAIN_SELECTOR,
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

  const proposalTitleRef = useRef<HTMLInputElement>(null);

  const { writeContractAsync } = useWriteContract();

  const { switchChainAsync } = useSwitchChain();

  const { address: userAddress } = useAccount();

  // @ts-ignore
  const fromRouter = useRouter({ chainSelector: ethereumChain.chainSelector });
  // @ts-ignore
  const toRouter = useRouter({ chainSelector: arbitrumChain.chainSelector });

  const fromRouterAddress = fromRouter.data;

  const toRouterAddress = toRouter.data;

  const { data: fromFee } = useReadContract({
    address: fromRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [Addresses.Healthcheck_EthereumSepolia_V1],
    query: { enabled: !!fromRouterAddress },
    chainId: ethereumChain?.definition.id,
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
    chainId: ethereumChain?.definition.id,
  });

  // TODO: will nee to parseUnits when calling the real thing
  const parsedCreateProposalFee = (createProposalFee as any) || 0.01;

  // TODO: get units for the native coin in the deployed `from`
  const sourceChainCoinSymbol =
    ethereumChain?.definition?.nativeCurrency?.symbol;

  const parsedFromFee = fromFee
    ? `${Number(formatUnits(fromFee, 18)).toFixed(8)} ${
        ethereumChain?.definition?.nativeCurrency?.symbol
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
      chainId: ethereumChain?.definition.id,
    });
    return waitForTransactionReceipt(config, {
      hash,
      chainId: ethereumChain?.definition.id,
    });
  };

  const onClickCreateProposal = async () => {
    setStatus(Status.IsCreatingProposal);
    // @ts-ignore
    await switchChainAsync({ chainId: ethereumChain.definition.id });
    const createProposalReceipt = await createProposal();
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
      <div>ethereum from fee: {parsedFromFee}</div>
      <div>arbitrum to fee: {parsedToFee}</div>

      {/* Creating a proposal fee */}
      <div>
        EquitoVote fee: {parsedCreateProposalFee} {sourceChainCoinSymbol} (fee
        is only charged on proposal creation)
      </div>
    </div>
  );
}
