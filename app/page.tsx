"use client";

import { useEffect, useRef, useState } from "react";
import { addHours } from "date-fns";
import { useAccount, useSwitchChain, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Addresses } from "@/addresses";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import { chains } from "@/utils/chains";
import { config } from "@/utils/wagmi";

const equitoVoteAbi = equitoVote.abi;

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

      <div>Create Proposal</div>

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
    </div>
  );
}
