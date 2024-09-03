import { FormattedProposal, ProposalDataItem, ProposalResponse } from "@/types";

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

export function formatProposalItem(data: ProposalDataItem) {
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

export function buildProposalFromArray(
  proposalArrayData: Array<ProposalDataItem>,
) {
  return !Array.isArray(proposalArrayData)
    ? {}
    : Object.keys(placeholderProposal).reduce(
        (acc, key, index) => {
          acc[key] = formatProposalItem(proposalArrayData[index]);
          return acc;
        },
        {} as Record<string, any>,
      );
}
