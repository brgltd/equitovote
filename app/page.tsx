"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useReadContract } from "wagmi";
import { formatProposals } from "@/utils/helpers";
import { ProposalResponse } from "@/types";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";
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

  const {
    data: proposals,
    isLoading: isLoadingProposals,
    isError: isErrorFetchingProposals,
    error: errorFetchingProposals,
  } = useReadContract({
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

  if (isErrorFetchingProposals) {
    console.error(errorFetchingProposals);
    return <div>error</div>;
  }

  if (isLoadingProposals) {
    return <div>loading</div>;
  }

  if (!normalizedProposals.length) {
    return <div>no proposal created</div>;
  }

  return (
    <div>
      {normalizedProposals.map((item) => (
        <div key={item.id}>
          <hr />
          <div>
            <div>startTimestamp {item.startTimestamp}</div>
            <div>endTimestamp {item.endTimestamp}</div>
            <div>numVotesYes {item.numVotesYes}</div>
            <div>numVotesNo {item.numVotesNo}</div>
            <div>numVotesAbstain {item.numVotesAbstain}</div>
            <div>title {item.title}</div>
            <div>description {item.description}</div>
            <div>id {item.id}</div>
            <div>startBlockNumber {item.startBlockNumber}</div>
            <div>token name {item.tokenName}</div>
            <div>Proposal Created On: {item.originChainSelector}</div>
            <div>Voting Available On: [1001, 1004, 1006]</div>
            <Link href={`/vote/${item.id}`}>Vote</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
