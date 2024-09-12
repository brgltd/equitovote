"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChainSelect } from "./chain-select";
import { useEquitoVote } from "@/providers/equito-vote-provider";

export function Navbar() {
  const { isClient, userAddress } = useEquitoVote();

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
            chainStatus="full"
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
        {/* <ChainSelect /> */}
      </ul>
    </nav>
  );
}
