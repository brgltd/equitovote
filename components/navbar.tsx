"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

export function Navbar() {
  const [isClient, setIsClient] = useState(false);

  const { address: userAddress } = useAccount();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
      </ul>
    </nav>
  );
}
