import {
  sepolia,
  arbitrumSepolia,
  optimismSepolia,
  baseSepolia,
  blastSepolia,
} from "wagmi/chains";
import { Address, type Chain as Definition } from "viem";
import { Addresses } from "@/utils/addresses";

export type Chain = {
  chainSelector: number;
  name: string;
  img: number;
  definition: Definition;
  equitoVoteContractV2: Address;
  faucet: Address;
  voteSphere: Address;
  metaQuorum: Address;
  chainLight: Address;
};

export type SupportedChainsMap = Record<number, Chain>;

export const ethereumChain = {
  chainSelector: 1001,
  name: "Ethereum Sepolia",
  img: 1027,
  definition: sepolia,
  equitoVoteContractV2: Addresses.EthereumSepolia.EquitoVoteV2,
  faucet: Addresses.EthereumSepolia.Faucet,
  voteSphere: Addresses.EthereumSepolia.VoteSphereToken,
  metaQuorum: Addresses.EthereumSepolia.MetaQuorumToken,
  chainLight: Addresses.EthereumSepolia.ChainLightToken,
};

export const arbitrumChain = {
  chainSelector: 1004,
  name: "Arbitrum Sepolia",
  img: 11841,
  definition: arbitrumSepolia,
  equitoVoteContractV2: Addresses.ArbitrumSepolia.EquitoVoteV2,
  faucet: Addresses.ArbitrumSepolia.Faucet,
  voteSphere: Addresses.ArbitrumSepolia.VoteSphereToken,
  metaQuorum: Addresses.ArbitrumSepolia.MetaQuorumToken,
  chainLight: Addresses.ArbitrumSepolia.ChainLightToken,
};

export const optimismChain = {
  chainSelector: 1006,
  name: "Optimism Sepolia",
  img: 11840,
  definition: optimismSepolia,
  equitoVoteContractV2: Addresses.OptimismSepolia.EquitoVoteV2,
  faucet: Addresses.OptimismSepolia.Faucet,
  voteSphere: Addresses.OptimismSepolia.VoteSphereToken,
  metaQuorum: Addresses.OptimismSepolia.MetaQuorumToken,
  chainLight: Addresses.OptimismSepolia.ChainLightToken,
};

export const baseChain = {
  chainSelector: 1007,
  name: "Base Sepolia",
  img: 9195,
  definition: baseSepolia,
  equitoVoteContractV2: Addresses.BaseSepolia.EquitoVoteV2,
  faucet: Addresses.BaseSepolia.Faucet,
  voteSphere: Addresses.BaseSepolia.VoteSphereToken,
  metaQuorum: Addresses.BaseSepolia.MetaQuorumToken,
  chainLight: Addresses.BaseSepolia.ChainLightToken,
};

export const blastChain = {
  chainSelector: 1018,
  name: "Blast Sepolia",
  img: 28480,
  definition: blastSepolia,
  equitoVoteContractV2: Addresses.BlastSepolia.EquitoVoteV2,
  faucet: Addresses.BlastSepolia.Faucet,
  voteSphere: Addresses.BlastSepolia.VoteSphereToken,
  metaQuorum: Addresses.BlastSepolia.MetaQuorumToken,
  chainLight: Addresses.BlastSepolia.ChainLightToken,
};

export const supportedChains: Chain[] = [
  ethereumChain,
  arbitrumChain,
  optimismChain,
  baseChain,
  blastChain,
];

export const supportedChainsMap = supportedChains.reduce(
  (acc: SupportedChainsMap, curr) => {
    acc[curr.definition.id] = curr;
    return acc;
  },
  {},
);

export const supportedChainsMapBySelector = supportedChains.reduce(
  (acc: SupportedChainsMap, curr) => {
    acc[curr.chainSelector] = curr;
    return acc;
  },
  {},
);

export const NATIVE_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export const destinationChain = arbitrumChain;
