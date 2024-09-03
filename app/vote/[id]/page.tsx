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

  const formattedProposal = useMemo(
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
            <div>startTimestamp {formattedProposal.startTimestamp}</div>
            <div>endTimestamp {formattedProposal.endTimestamp}</div>
            <div>numVotesYes {formattedProposal.numVotesYes}</div>
            <div>numVotesNo {formattedProposal.numVotesNo}</div>
            <div>numVotesAbstain {formattedProposal.numVotesAbstain}</div>
            <div>erc20 {formattedProposal.erc20}</div>
            <div>creator {formattedProposal.creator}</div>
            <div>title {formattedProposal.title}</div>
            <div>description {formattedProposal.description}</div>
            <div>id {formattedProposal.id}</div>
          </div>
          <button className="block">Yes</button>
          <button className="block">No</button>
          <button className="block">Abstain</button>
        </div>
      )}
    </div>
  );
}
