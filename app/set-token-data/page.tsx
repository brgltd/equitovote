"use client";

import { AddressesPerChain } from "@/addresses";
import { useState } from "react";
import { useWriteContract } from "wagmi";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";
import { arbitrumChain, ethereumChain, optimismChain } from "@/utils/chains";

const equitoVoteAbi = equitoVote.abi;

const defaultFormData = {
  tokenName: "",
  ethereumAddress: "",
  arbitrumAddress: "",
  optimismAddress: "",
};

export default function SetTokenDataPage() {
  const [formData, setFormData] = useState(defaultFormData);

  const { writeContractAsync } = useWriteContract();

  const onClickSetTokenData = async () => {
    const hash = await writeContractAsync({
      address: AddressesPerChain.ArbitrumSepolia.EquitoVoteActive,
      abi: equitoVoteAbi,
      functionName: "setTokenData",
      args: [
        formData.tokenName,
        [
          ethereumChain.chainSelector,
          arbitrumChain.chainSelector,
          optimismChain.chainSelector,
        ],
        [
          formData.ethereumAddress,
          formData.arbitrumAddress,
          formData.optimismAddress,
        ],
      ],
    });
  };

  return (
    <div>
      <div>
        <label htmlFor="token-name">token name</label>
        <input
          type="text"
          id="token-name"
          value={formData.tokenName}
          onChange={(e) =>
            setFormData({ ...formData, tokenName: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="ethereum-address">ethereum address</label>
        <input
          type="text"
          id="ethereum-address"
          value={formData.ethereumAddress}
          onChange={(e) =>
            setFormData({ ...formData, ethereumAddress: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="arbitrum address">arbitrum address</label>
        <input
          type="text"
          id="arbitrum-address"
          value={formData.arbitrumAddress}
          onChange={(e) =>
            setFormData({ ...formData, arbitrumAddress: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <label htmlFor="optimism-address">optimism address</label>
        <input
          type="text"
          id="optimism-address"
          value={formData.optimismAddress}
          onChange={(e) =>
            setFormData({ ...formData, optimismAddress: e.target.value })
          }
          className="text-black"
        />
      </div>

      <div>
        <button
          onClick={onClickSetTokenData}
          disabled={Object.values(formData).every(Boolean)}
        >
          Set Token Data
        </button>
      </div>
    </div>
  );
}
