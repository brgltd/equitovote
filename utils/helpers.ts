import { FormattedProposal, ProposalDataItem, ProposalResponse } from "@/types";

// Order is important for this object
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

// Order is important for this object
export const placeholderProposalV2: FormattedProposal = {
  startTimestamp: 0,
  endTimestamp: 0,
  numVotesYes: 0,
  numVotesNo: 0,
  numVotesAbstain: 0,
  title: "",
  description: "",
  id: "",
  tokenName: "",
  startBlockNumber: 0,
  originChainSelector: 0,
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
  isV2 = false,
) {
  return !Array.isArray(proposalArrayData)
    ? {}
    : Object.keys(isV2 ? placeholderProposalV2 : placeholderProposal).reduce(
        (acc, key, index) => {
          acc[key] = formatProposalItem(proposalArrayData[index]);
          return acc;
        },
        {} as Record<string, any>,
      );
}

export function verifyIsGetPastVotesEnabled() {
  return process.env.NEXT_PUBLIC_IS_GET_PAST_VOTES_ENABLED_ENABLED === "true";
}

export function verifyIsProposalActive(proposal: FormattedProposal) {
  return proposal.endTimestamp > Math.floor(Date.now() / 1000);
}
