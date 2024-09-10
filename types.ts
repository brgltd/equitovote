export interface ProposalResponse {
  startTimestamp: bigint;
  endTimestamp: bigint;
  numVotesYes: bigint;
  numVotesNo: bigint;
  numVotesAbstain: bigint;
  title: string;
  description: string;
  id: string;
  // v1
  erc20?: string;
  creator?: string;
  // v2
  startBlockNumber?: number;
  tokenName?: string;
  originalChainSelector?: number;
}

type BigintToNumber<T> = {
  [K in keyof T]: T[K] extends bigint ? number : T[K];
};

export type FormattedProposal = BigintToNumber<ProposalResponse>;

export type ProposalDataItem = string | number | bigint;

export enum Status {
  IsStart = "IS_START",
  IsExecutingBaseTxOnSourceChain = "IS_EXECUTING_BASE_TX_ON_SOURCE_CHAIN",
  IsRetrievingBlockOnSourceChain = "IS_RETRIEVING_BLOCK_ON_SOURCE_CHAIN",
  IsGeneratingProofOnSourceChain = "IS_GENERATING_PROOF_ON_SOURCE_CHAIN",
  IsExecutingMessageOnDestinationChain = "IS_EXECUTING_MESSAGE_ON_DESTINATION_CHAIN",
  IsRetry = "IS_RETRY",
}
