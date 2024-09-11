import { Address } from "viem";

export const Addresses = {
  // Deployed contracts of EquitoSwap
  EquitoSwap_EthereumSepolia_V1: "0x27eEb830986B44eC05e78912Ee9A0CB9820211bb",
  EquitoSwap_ArbitrumSepolia_V1: "0x496667E89C15409e9a1E7e0f2D15DcDFac430300",

  // Deployed contracts of Healthcheck
  Healthcheck_EthereumSepolia_V1:
    "0xDb8a55b811DEBBe5cd28a1db7E78f0fE5d282862" as Address,
  Healthcheck_ArbitrumSepolia_V1:
    "0xCD7949891D3075EF8681b9624746Ea78a5C27aa4" as Address,

  // Chainlink token
  Link_EthereumSepolia: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
};

export const AddressesPerChain = {
  EthereumSepolia: {
    EquitoVoteV1: "0xEACAcDd65bbbDd15E7AcA41eF5311a33A8B9178c" as Address,
    EquitoVoteV2: "0x0000000000000000000000000000000000000000" as Address, // V2 not deployed on ethereum

    VoteSphere: "0x2ee891078cc2a08c31e494f19E36F772806b1613" as Address,
  },
  ArbitrumSepolia: {
    EquitoVoteV1: "0x45e0ce44717dbeeF610FCC2B45aaea40901AcB26" as Address,
    EquitoVoteV2: "0x454CbDa3dD385bF6db681f3E716A2a94b738bBd7" as Address,

    VoteSphere: "0xC175b8abba483e57d36b7EBd9b4d3fBf630FECCA" as Address,
  },
  OptimismSepolia: {
    EquitoVoteV1: "0x0000000000000000000000000000000000000000" as Address, // V1 not deployed to optimism
    EquitoVoteV2: "0xBF640425d199D33b84E150DAc80D2d961F63AD51" as Address,

    VoteSphere: "0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e" as Address,
  },
};
