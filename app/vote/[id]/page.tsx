"use client";

import { useMemo } from "react";
import { destinationChain } from "@/utils/chains";
import { useReadContract, useWriteContract } from "wagmi";
import { buildProposalFromArray } from "@/utils/helpers";
import { FormattedProposal, ProposalDataItem, ProposalResponse } from "@/types";
import equitoVote from "@/out/EquitoVote.sol/EquitoVote.json";
import { Addresses, AddressesPerChain } from "@/addresses";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address } from "viem";
import { config } from "@/utils/wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import erc20Abi from "@/abis/erc20.json";

const equitoVoteAbi = equitoVote.abi;

enum VoteOption {
  Yes = 0,
  No = 1,
  Abstain = 2,
}

export default function Vote({ params }: { params: { id: string } }) {
  const { id: proposalId } = params;

  const { sourceChain } = useEquitoVote();

  const { writeContractAsync } = useWriteContract();

  const { data: proposalData, isLoading: isLoadingProposal } = useReadContract({
    address: destinationChain.equitoVoteContract,
    abi: equitoVoteAbi,
    functionName: "proposals",
    args: [proposalId],
    chainId: destinationChain.definition.id,
  });
  const proposal = proposalData as ProposalDataItem[];

  //@ts-ignore
  const formattedProposal: FormattedProposal = useMemo(
    () => buildProposalFromArray(proposal),
    [proposal],
  );

  const { data: tokenNameData } = useReadContract({
    address: formattedProposal.erc20 as Address,
    abi: erc20Abi,
    functionName: "name",
    chainId: sourceChain?.definition.id,
    query: { enabled: !!proposal },
  });
  const tokenName = tokenNameData as string;

  // const { data: userBalanceData } = useReadContract({
  //   address: formattedProposal.erc20 as Address,
  //   abi: erc20Abi,
  //   functionName: "name",
  //   chainId: sourceChain?.definition.id,
  //   query: { enabled: !!proposal },
  // });

  const approveERC20 = async () => {
    const hash = await writeContractAsync({
      address: formattedProposal.erc20 as Address,
      abi: erc20Abi,
      functionName: "approve",
      args: [sourceChain?.equitoVoteContract, "25000000000000000000"],
    });
    await waitForTransactionReceipt(config, { hash });
  };

  const voteOnProposal = async (voteOption: VoteOption) => {
    const hash = await writeContractAsync({
      address: sourceChain?.equitoVoteContract as Address,
      abi: equitoVoteAbi,
      functionName: "voteOnProposal",
      args: [
        destinationChain.chainSelector,
        proposalId,
        1,
        voteOption,
        formattedProposal.erc20,
      ],
      chainId: sourceChain?.definition.id,
    });
    return waitForTransactionReceipt(config, {
      hash,
      chainId: sourceChain?.definition.id,
    });
  };

  const onClickVoteOnProposal = async (voteOption: VoteOption) => {
    // approve erc20
    // voteOnProposal()
  };

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
          <div>token name: {tokenName}</div>
          <div>token balance: </div>
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.Yes)}
            className="block"
          >
            Yes
          </button>
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.No)}
            className="block"
          >
            No
          </button>
          <button
            onClick={() => onClickVoteOnProposal(VoteOption.Abstain)}
            className="block"
          >
            Abstain
          </button>
        </div>
      )}
    </div>
  );
}
