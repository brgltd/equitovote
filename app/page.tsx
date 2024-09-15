"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { useReadContract } from "wagmi";
import {
  formatProposals,
  formatTimestamp,
  PAGINATION_SIZE,
  rearrangeSupportedChains,
  verifyIsProposalActive,
} from "@/utils/helpers";
import { FormattedProposal, ProposalResponse } from "@/types";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { supportedChains, supportedChainsMapBySelector } from "@/utils/chains";
import { Pagination } from "@mui/material";
import { ProposalsSkeleton } from "@/components/proposals-skeleton";

const equitoVoteAbi = equitoVote.abi;

function buildGetProposalsSliceArgs(
  pageNumber: number,
  proposalsLength: number | undefined,
) {
  if (!proposalsLength) {
    return [0, PAGINATION_SIZE];
  }
  // Material UI page number starts with 1.
  // `getProposalsSlice` uses inclusive start and non-inclusive end.
  const start = pageNumber - 1;
  const end = pageNumber - 1 + PAGINATION_SIZE;
  return proposalsLength < end ? [start, proposalsLength] : [start, end];
}

function getPaginationCount(proposalsLength: number | undefined) {
  if (!proposalsLength) {
    return 1;
  }
  return Math.ceil(proposalsLength / PAGINATION_SIZE);
}

export default function HomePage() {
  const [pageNumber, setPageNumber] = useState(1);

  const { destinationChain } = useEquitoVote();

  const { data: proposalsLengthData } = useReadContract({
    address: destinationChain.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "getProposalIdsLength",
    chainId: destinationChain.definition.id,
  });
  const proposalsLength = proposalsLengthData as bigint | undefined;
  const proposalsLengthNumber = !!proposalsLength
    ? Number(proposalsLength)
    : undefined;

  const {
    data: proposals,
    isPending: isPendingProposals,
    isError: isErrorFetchingProposals,
    error: errorFetchingProposals,
    refetch: refetchProposals,
    isRefetching: isRefetchingProposals,
    isRefetchError: isErrorRefetchingProposals,
  } = useReadContract({
    address: destinationChain.equitoVoteContractV2,
    abi: equitoVoteAbi,
    functionName: "getProposalsSlice",
    args: buildGetProposalsSliceArgs(pageNumber, proposalsLengthNumber),
    query: { enabled: !!proposalsLength },
    chainId: destinationChain.definition.id,
  });

  const normalizedProposals = useMemo(
    () => formatProposals(proposals as ProposalResponse[]),
    [proposals],
  );

  const onChangePageNumber = (event: ChangeEvent<unknown>, value: number) => {
    setPageNumber(value);
    refetchProposals();
  };

  if (isErrorFetchingProposals || isErrorRefetchingProposals) {
    console.error(errorFetchingProposals);
    return <div>Error occurred fetching proposals</div>;
  }

  if (isPendingProposals || isRefetchingProposals) {
    return <ProposalsSkeleton />;
  }

  if (!normalizedProposals.length) {
    return <div>No proposal available</div>;
  }

  return (
    <div>
      <ul>
        {normalizedProposals.map((item) => {
          const isActive = verifyIsProposalActive(item as FormattedProposal);
          const originChainImg =
            supportedChainsMapBySelector[item.originChainSelector]?.img;
          const startDate = formatTimestamp(item.startTimestamp);
          const endDate = formatTimestamp(item.endTimestamp);
          // Rendering origin chain as the first one available.
          // Should not result in a performance hit since there can be
          // ~20 chains maximum.
          const rearrangedSupportedChains = rearrangeSupportedChains(
            supportedChains,
            item.originChainSelector,
          );
          return (
            <li key={item.id}>
              <Link
                href={`/vote/${item.id}`}
                className="flex flex-row justify-center"
              >
                <div
                  className="border rounded-lg border-gray-400 hover:border-white shadow-md hover:shadow-blue-500/50 transition-all flex md:flex-row md:justify-between flex-col p-4 mb-10"
                  style={{ width: "100%", maxWidth: "1200px" }}
                >
                  <div>
                    <div
                      className="text-xl font-semibold mb-2"
                      style={{ width: "100%", maxWidth: "800px" }}
                    >
                      {item.title}
                    </div>
                    <div
                      className="mb-2"
                      style={{ width: "100%", maxWidth: "800px" }}
                    >
                      {item.description}
                    </div>
                    <div className="mb-2">
                      {startDate} - {endDate}
                    </div>
                    <div className="mb-2">DAO Token: {item.tokenName}</div>
                    <div className="flex flex-row items-center">
                      <div
                        className={`mr-2 w-4 h-4 rounded-full bg-${isActive ? "green" : "stone"}-600`}
                      />{" "}
                      {isActive ? "Live" : "Completed"}
                    </div>
                  </div>
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="flex flex-row items-center md:justify-end mb-4 md:mt-0 mt-4">
                        Proposal Created on
                        <img
                          src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${originChainImg}.png`}
                          width={32}
                          height={32}
                          className="rounded-full ml-2"
                        />
                      </div>
                    </div>
                    <div className="flex sm:flex-row flex-col sm:items-center">
                      <div className="md:mb-0 mb-2">Voting available on</div>
                      <div className="flex flex-row">
                        {rearrangedSupportedChains.map((chain) => (
                          <img
                            src={`https://s2.coinmarketcap.com/static/img/coins/64x64/${chain.img}.png`}
                            width={32}
                            height={32}
                            className="rounded-full ml-2"
                            key={chain.definition.id}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
      {!!proposalsLengthNumber && proposalsLengthNumber > PAGINATION_SIZE && (
        <div className="mb-16">
          <Pagination
            count={getPaginationCount(proposalsLengthNumber)}
            page={pageNumber}
            onChange={onChangePageNumber}
          />
        </div>
      )}
    </div>
  );
}
