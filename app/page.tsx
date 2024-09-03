"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arbitrumChain, Chain } from "@/utils/chains";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";

const equitoVoteAbi = equitoVote.abi;

const destinationChain = arbitrumChain;

interface ProposalResponse {
  startTimestamp: bigint;
  endTimestamp: bigint;
  numVotesYes: bigint;
  numVotesNo: bigint;
  numVotesAbstain: bigint;
  erc20: string;
  creator: string;
  title: string;
  description: string;
  id: string;
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

  const { address: userAddress } = useAccount();

  const { data: proposalsLength } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "getProposalIdsLength",
    chainId: destinationChain.definition.id,
  });

  const { data: proposals, isLoading: isLoadingProposals } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "getProposalsSlice",
    args: [0, proposalsLength],
    query: { enabled: !!proposalsLength },
    chainId: destinationChain.definition.id,
  });

  const normalizedProposals = useMemo(
    () => normalizeResponse(proposals),
    [proposals],
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div>
      <hr />
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

      <div>list of proposals section</div>
      {isLoadingProposals ? (
        <div>loading</div>
      ) : (
        <div>{JSON.stringify(normalizedProposals, null, 4) || "Empty"}</div>
      )}

      <hr />
    </div>
  );
}
