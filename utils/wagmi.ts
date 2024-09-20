import { getDefaultWallets, getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  trustWallet,
  ledgerWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { supportedChains } from "./chains";
import { type Chain as Definition } from "viem";

const chainDefinitions = supportedChains.map((chain) => chain.definition) as [
  Definition,
];

export const getChainTrasports = () =>
  chainDefinitions.reduce(
    (acc, { id }) => ({
      ...acc,
      [id]: http(),
    }),
    {},
  );

export const wagmiConfig = (() => {
  return getDefaultConfig({
    appName: "equitovote",
    projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string,
    wallets: [
      ...getDefaultWallets().wallets,
      {
        groupName: "Other",
        wallets: [argentWallet, trustWallet, ledgerWallet],
      },
    ],
    chains: chainDefinitions,
  });
})();

export const config = (() => {
  return createConfig({
    chains: chainDefinitions,
    transports: getChainTrasports(),
  });
})();
