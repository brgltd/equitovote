"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  darkTheme as rainbowDarkTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v14-appRouter";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { wagmiConfig } from "../utils/wagmi";
import { EquitoProvider } from "../providers/equito-provider";
import { PingPongProvider } from "../providers/ping-pong-provider";
import { Navbar } from "@/components/navbar";
import { EquitoVoteProvider } from "@/providers/equito-vote-provider";
import "./globals.css";
import "@rainbow-me/rainbowkit/styles.css";

const inter = Inter({ subsets: ["latin"] });

const queryClient = new QueryClient();

// export const metadata: Metadata = {
//   title: "Equito Vote",
//   description: "Multichain DAO voting protocol",
// };

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
});
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
            <RainbowKitProvider theme={rainbowDarkTheme()}>
              {/* EquitoProvider and PingPongProvider used for testing and healthcheck */}
              {/* route /pingpong = test contracts deployed from equito team */}
              {/* route /healthcheck = test a healthcheck contract that makes a crosschain call */}
              <EquitoProvider>
                <PingPongProvider>
                  {/* EquitoVoteProvider holds global data, e.g. connected address, user source chain etc */}
                  <EquitoVoteProvider>
                    <AppRouterCacheProvider>
                      <ThemeProvider theme={darkTheme}>
                        <CssBaseline />
                        <div className="flex flex-row justify-center">
                          {/* <div className="max-w-screen-2xl border"> */}
                          <div
                            // style={{ maxWidth: 1500, border: "1px solid red" }}
                            // style={{ border: "1px solid red" }}
                            style={{ width: 1300 }}
                          >
                            <Navbar />
                            {children}
                          </div>
                        </div>
                      </ThemeProvider>
                    </AppRouterCacheProvider>
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
