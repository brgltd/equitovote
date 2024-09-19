import { Address, zeroAddress } from "viem";

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
    EquitoVoteV2: zeroAddress as Address, // V2 not deployed on ethereum

    VoteSphereToken: "0x2ee891078cc2a08c31e494f19E36F772806b1613" as Address,
    MetaQuorumToken: "0x61009c81b50E0Fa52DCa913D7aC3F81744Dd4063" as Address,
    ChainLightToken: "0x7756e14E1b9CbbB1e1Ab2fc940175fbc51Bc97a7" as Address,

    Faucet: "0x18a22b51e1f08383ce18Aaf5f2637539a06688a2" as Address,
  },

  ArbitrumSepolia: {
    EquitoVoteV1: "0x45e0ce44717dbeeF610FCC2B45aaea40901AcB26" as Address,
    EquitoVoteV2: "0x191770Db1Fb7833bB09bd6e5c8976b8a417AB3A0" as Address,

    VoteSphereToken: "0xC175b8abba483e57d36b7EBd9b4d3fBf630FECCA" as Address,
    MetaQuorumToken: "0xe4f6Da5ceB777ade0937dAb8994FF9483494319E" as Address,
    ChainLightToken: "0xe1e5C1ED4b9946CBc693F9C5847aa9c908B4ec9c" as Address,

    Faucet: "0x94d80f74E8163B842cedb1b051c2a48EB6aF9089" as Address,
  },

  OptimismSepolia: {
    EquitoVoteV1: zeroAddress as Address, // V1 not deployed to optimism
    EquitoVoteV2: zeroAddress as Address, // TODO: deploy V2 on optimism

    VoteSphereToken: "0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e" as Address,
    MetaQuorumToken: zeroAddress as Address,
    ChainLightToken: zeroAddress as Address,

    Faucet: zeroAddress as Address,
  },

  BaseSepolia: {
    EquitoVoteV1: zeroAddress as Address, // V1 not deployed to optimism
    EquitoVoteV2: zeroAddress as Address, // TODO: deploy V2 on optimism

    VoteSphereToken: "0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e" as Address,
    MetaQuorumToken: zeroAddress as Address,
    ChainLightToken: zeroAddress as Address,

    Faucet: zeroAddress as Address,
  },

  BlastSepolia: {
    EquitoVoteV1: zeroAddress as Address, // V1 not deployed to optimism
    EquitoVoteV2: zeroAddress as Address, // TODO: deploy V2 on optimism

    VoteSphereToken: "0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e" as Address,
    MetaQuorumToken: zeroAddress as Address,
    ChainLightToken: zeroAddress as Address,

    Faucet: zeroAddress as Address,
  },
};
