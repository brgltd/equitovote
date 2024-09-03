"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arbitrumChain } from "@/utils/chains";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import { formatProposals } from "@/utils/helpers";
import { ProposalResponse } from "@/types";

const equitoVoteAbi = equitoVote.abi;

const destinationChain = arbitrumChain;

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
    () => formatProposals(proposals as ProposalResponse[]),
    [proposals],
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

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

      {isLoadingProposals ? (
        <div>loading</div>
      ) : (
        normalizedProposals.map((item) => (
          <div key={item.id}>
            <hr />
            <div>
              <div>startTimestamp {item.startTimestamp}</div>
              <div>endTimestamp {item.endTimestamp}</div>
              <div>numVotesYes {item.numVotesYes}</div>
              <div>numVotesNo {item.numVotesNo}</div>
              <div>numVotesAbstain {item.numVotesAbstain}</div>
              <div>erc20 {item.erc20}</div>
              <div>creator {item.creator}</div>
              <div>title {item.title}</div>
              <div>description {item.description}</div>
              <div>id {item.id}</div>
              <Link href={`/vote/${item.id}`}>Vote</Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
