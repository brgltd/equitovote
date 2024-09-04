"use client";

import { useEquitoVote } from "@/providers/equito-vote-provider";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { ChainSelect } from "./chain-select";

export function Navbar() {
  const { isClient, userAddress, setSourceChain } = useEquitoVote();

  return (
    <nav>
      <ul>
        <li>
          <Link href="/">Proposals</Link>
        </li>
        <li>
          <Link href="/create">Create</Link>
        </li>
        <li>
          <ConnectButton
            chainStatus="none"
            showBalance={false}
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
          />
          {isClient && userAddress
            ? `address: ${userAddress}`
            : "not connected"}
        </li>
        <ChainSelect setSourceChain={setSourceChain} />
      </ul>
    </nav>
  );
}
