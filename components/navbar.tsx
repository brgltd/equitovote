"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function Navbar() {
  return (
    <nav>
      <ul className="flex md:flex-row flex-col items-center mt-6 mb-8 justify-center">
        <div className="flex flex-row mb-8 md:mb-0">
          <li className="ml-0 md:ml-12 mr-12 hover-glow">
            <Link href="/">PROPOSALS</Link>
          </li>
          <li className="hover-glow">
            <Link href="/create">CREATE</Link>
          </li>
        </div>
        <li className="md:ml-auto md:mr-12">
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
