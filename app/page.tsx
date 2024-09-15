"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useReadContract } from "wagmi";
import {
  formatProposals,
  formatTimestamp,
  rearrangeSupportedChains,
  verifyIsProposalActive,
} from "@/utils/helpers";
import { FormattedProposal, ProposalResponse } from "@/types";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import {
  ethereumChain,
  supportedChains,
  supportedChainsMap,
  supportedChainsMapBySelector,
} from "@/utils/chains";

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
    isPending: isPendingProposals,
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

  if (isPendingProposals) {
    return <div>loading</div>;
  }

  if (!normalizedProposals.length) {
    return <div>no proposal created</div>;
  }

  return (
    <ul>
      {normalizedProposals.map((item) => {
        const isActive = !verifyIsProposalActive(item as FormattedProposal);
        const originChainImg =
          supportedChainsMapBySelector[item.originChainSelector]?.img;
        const startDate = formatTimestamp(item.startTimestamp);
        const endDate = formatTimestamp(item.endTimestamp);
        // Rendering origin chain as the first one available.
        // Should not result in a performance hit since there would be
        // 20 chains maximum.
        const rearrangedChains = rearrangeSupportedChains(
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
                className="border rounded-lg border-gray-400 hover:border-white shadow-md hover:shadow-blue-500/50 transition-all flex md:flex-row md:justify-between flex-col p-4 ml-12 mr-12"
                style={{ width: "100%", maxWidth: "1200px" }}
              >
                <div>
                  <div className="text-xl font-semibold mb-2">{item.title}</div>
                  <div className="mb-2">{item.description}</div>
                  <div className="mb-2">
                    {startDate} - {endDate}
                  </div>
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
                      {rearrangedChains.map((chain) => (
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
  );
}
