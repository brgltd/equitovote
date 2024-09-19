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

    EquitoVoteV2: "" as Address, // V2 not deployed on ethereum

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

    EquitoVoteV2: "" as Address, // TODO: deploy V2 on optimism

    VoteSphereToken: "0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e" as Address,
    MetaQuorumToken: "0xD39A5C47207F658dc0Ed09c77c08efa30562383F" as Address,
    ChainLightToken: "0x3155BCD41f424f28A21aaebB71bff3e3d7421a77" as Address,

    Faucet: "0xd59e81c1A016b146BfA826C52BEa8c30F69c6f07" as Address,
  },

  BaseSepolia: {
    EquitoVoteV1: "" as Address,

    EquitoVoteV2: "" as Address,

    VoteSphereToken: "0xBF640425d199D33b84E150DAc80D2d961F63AD51" as Address,
    MetaQuorumToken: "0x57BF31E4364B76D9440Ba8744EE2643504De0f7A" as Address,
    ChainLightToken: "0x7B1E2d74D82Ac57d86f783f8Abbd1D255206929e" as Address,

    Faucet: "0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e" as Address,
  },

  BlastSepolia: {
    EquitoVoteV1: "" as Address,

    EquitoVoteV2: "" as Address,

    VoteSphereToken: "" as Address,
    MetaQuorumToken: "" as Address,
    ChainLightToken: "" as Address,

    Faucet: "" as Address,
  },
};
