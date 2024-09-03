"use client";

import { useMemo } from "react";
import { destinationChain } from "@/utils/chains";
import { useReadContract } from "wagmi";
import { buildProposalFromArray } from "@/utils/helpers";
import { ProposalDataItem } from "@/types";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";

const equitoVoteAbi = equitoVote.abi;

export default function Vote({ params }: { params: { id: string } }) {
  const { data: proposal, isLoading: isLoadingProposal } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "proposals",
    args: [params.id],
    chainId: destinationChain.definition.id,
  });

  const normalizedProposal = useMemo(
    () => buildProposalFromArray(proposal as ProposalDataItem[]),
    [proposal],
  );

  return (
    <div>
      {isLoadingProposal ? (
        <div>loading</div>
      ) : (
        <div>
          <div>
            <div>startTimestamp {normalizedProposal.startTimestamp}</div>
            <div>endTimestamp {normalizedProposal.endTimestamp}</div>
            <div>numVotesYes {normalizedProposal.numVotesYes}</div>
            <div>numVotesNo {normalizedProposal.numVotesNo}</div>
            <div>numVotesAbstain {normalizedProposal.numVotesAbstain}</div>
            <div>erc20 {normalizedProposal.erc20}</div>
            <div>creator {normalizedProposal.creator}</div>
            <div>title {normalizedProposal.title}</div>
            <div>description {normalizedProposal.description}</div>
            <div>id {normalizedProposal.id}</div>
          </div>
          <button>Yes</button>
          <button>No</button>
          <button>Abstain</button>
        </div>
      )}
    </div>
  );
}
