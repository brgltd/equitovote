export const pingPongAbi = [
  {
    type: "constructor",
    inputs: [
      {
        name: "_router",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "peers",
    inputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "lower",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "upper",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "receiveMessage",
    inputs: [
      {
        name: "message",
        type: "tuple",
        internalType: "struct EquitoMessage",
        components: [
          {
            name: "blockNumber",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "sourceChainSelector",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "sender",
            type: "tuple",
            internalType: "struct bytes64",
            components: [
              {
                name: "lower",
                type: "bytes32",
                internalType: "bytes32",
              },
              {
                name: "upper",
                type: "bytes32",
                internalType: "bytes32",
              },
            ],
          },
          {
            name: "destinationChainSelector",
            type: "uint256",
            internalType: "uint256",
          },
          {
            name: "receiver",
            type: "tuple",
            internalType: "struct bytes64",
            components: [
              {
                name: "lower",
                type: "bytes32",
                internalType: "bytes32",
              },
              {
                name: "upper",
                type: "bytes32",
                internalType: "bytes32",
              },
            ],
          },
          {
            name: "hashedData",
            type: "bytes32",
            internalType: "bytes32",
          },
        ],
      },
      {
        name: "messageData",
        type: "bytes",
        internalType: "bytes",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "sendPing",
    inputs: [
      {
        name: "destinationChainSelector",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "message",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "setPeers",
    inputs: [
      {
        name: "chainIds",
        type: "uint256[]",
        internalType: "uint256[]",
      },
      {
        name: "addresses",
        type: "tuple[]",
        internalType: "struct bytes64[]",
        components: [
          {
            name: "lower",
            type: "bytes32",
            internalType: "bytes32",
          },
          {
            name: "upper",
            type: "bytes32",
            internalType: "bytes32",
          },
        ],
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "newOwner",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "event",
    name: "OwnershipTransferred",
    inputs: [
      {
        name: "previousOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
      {
        name: "newOwner",
        type: "address",
        indexed: true,
        internalType: "address",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PingReceived",
    inputs: [
      {
        name: "sourceChainSelector",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "messageHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PingSent",
    inputs: [
      {
        name: "destinationChainSelector",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "messageHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PongReceived",
    inputs: [
      {
        name: "sourceChainSelector",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "messageHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "PongSent",
    inputs: [
      {
        name: "destinationChainSelector",
        type: "uint256",
        indexed: true,
        internalType: "uint256",
      },
      {
        name: "messageHash",
        type: "bytes32",
        indexed: false,
        internalType: "bytes32",
      },
    ],
    anonymous: false,
  },
  {
    type: "error",
    name: "InvalidLength",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidMessageSender",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidMessageType",
    inputs: [],
  },
  {
    type: "error",
    name: "InvalidRouter",
    inputs: [
      {
        name: "router",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableInvalidOwner",
    inputs: [
      {
        name: "owner",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "OwnableUnauthorizedAccount",
    inputs: [
      {
        name: "account",
        type: "address",
        internalType: "address",
      },
    ],
  },
  {
    type: "error",
    name: "RouterAddressCannotBeZero",
    inputs: [],
  },
  {
    type: "error",
    name: "RouterAlreadySet",
    inputs: [],
  },
] as const;
