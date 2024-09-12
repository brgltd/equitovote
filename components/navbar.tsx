"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav>
      <ul className="flex flex-row items-center mt-6 mb-8">
        <li className="ml-12 mr-8">
          <Link href="/">Proposals</Link>
        </li>
        <li>
          <Link href="/create">Create</Link>
        </li>
        <li className="ml-auto mr-12">
          <ConnectButton
            chainStatus="full"
            showBalance={false}
            accountStatus={{
              smallScreen: "avatar",
              largeScreen: "full",
            }}
          />
        </li>
      </ul>
    </nav>
  );
}
