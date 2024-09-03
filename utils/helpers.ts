import { FormattedProposal, ProposalResponse } from "@/types";

export const placeholderProposal: FormattedProposal = {
  startTimestamp: 0,
  endTimestamp: 0,
  numVotesYes: 0,
  numVotesNo: 0,
  numVotesAbstain: 0,
  erc20: "",
  creator: "",
  title: "",
  description: "",
  id: "",
};

export function formatProposalItem(data: any) {
  return typeof data === "bigint" ? Number(data) : data;
}

export function formatProposal(proposal: ProposalResponse) {
  return !proposal
    ? {}
    : Object.entries(proposal).reduce(
        (acc, [key, value]) => {
          acc[key] = formatProposalItem(value);
          return acc;
        },
        {} as Record<string, any>,
      );
}

export function formatProposals(proposals: ProposalResponse[]) {
  return !Array.isArray(proposals)
    ? []
    : proposals.map((proposal) => formatProposal(proposal));
}

export function buildProposalFromArray(array: any[]) {
  if (!Array.isArray(array)) {
    return {};
  }
  return Object.keys(placeholderProposal).reduce(
    (acc, key, index) => {
      acc[key] = formatProposalItem(array[index]);
      return acc;
    },
    {} as Record<string, any>,
  );
}
