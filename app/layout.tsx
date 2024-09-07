"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, midnightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "../utils/wagmi";
import { EquitoProvider } from "../providers/equito-provider";
import { PingPongProvider } from "../providers/ping-pong-provider";
import { Navbar } from "@/components/navbar";
import { EquitoVoteProvider } from "@/providers/equito-vote-provider";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

export const metadata: Metadata = {
  title: "Equito Vote",
  description: "Multichain DAO voting protocol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <WagmiProvider config={wagmiConfig}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider
              theme={midnightTheme({
                accentColor: "#6f76f6",
                accentColorForeground: "white",
                borderRadius: "small",
              })}
            >
              {/* EquitoProvider and PingPongProvider used for testing and healthcheck */}
              {/* route /pingpong = test contracts deployed from equito team */}
              {/* route /healthcheck = test a healthcheck contract that makes a crosschain call */}
              <EquitoProvider>
                <PingPongProvider>
                  {/* EquitoVoteProvider holds global data, e.g. connected address, user source chain etc */}
                  <EquitoVoteProvider>
                    <Navbar />
                    {children}
                  </EquitoVoteProvider>
                </PingPongProvider> 
              </EquitoProvider>
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
