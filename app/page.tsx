"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { formatProposals } from "@/utils/helpers";
import { ProposalResponse } from "@/types";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import { useEquitoVote } from "@/providers/equito-vote-provider";

const equitoVoteAbi = equitoVote.abi;

export default function HomePage() {
  const { destinationChain } = useEquitoVote();

  const { data: proposalsLength } = useReadContract({
    address: destinationChain.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "getProposalIdsLength",
    chainId: destinationChain.definition.id,
  });

  const { data: proposals, isLoading: isLoadingProposals } = useReadContract({
    address: destinationChain.equitoVoteContractV2,
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

  return (
    <div>
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
              <div>startBlockNumber {item.startBlockNumber}</div>
              <div>tokenName {item.tokenName}</div>
              <div>Proposal Created On: {item.originChainSelector}</div>
              <div>Voting Available On: [1001, 1004, 1006]</div>
              <Link href={`/vote/${item.id}`}>Vote</Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
