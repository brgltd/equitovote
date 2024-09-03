export interface ProposalResponse {
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

type BigintToNumber<T> = {
  [K in keyof T]: T[K] extends bigint ? number : T[K];
};

export type FormattedProposal = BigintToNumber<ProposalResponse>;
