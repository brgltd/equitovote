"use client";

import { useState } from "react";
import { useSwitchChain, useWriteContract } from "wagmi";
import equitoVote from "@/out/EquitoVoteV2.sol/EquitoVoteV2.json";
import { arbitrumChain, ethereumChain, optimismChain } from "@/utils/chains";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/utils/wagmi";
import { useEquitoVote } from "@/providers/equito-vote-provider";
import { Address, parseUnits } from "viem";

const equitoVoteAbi = equitoVote.abi;

// const defaultFormData = {
//   tokenName: "",
//   ethereumAddress: "",
//   arbitrumAddress: "",
//   optimismAddress: "",
// };

const defaultFormData = {
  tokenName: "VoteSphere4",
  ethereumAddress: "0x2ee891078cc2a08c31e494f19E36F772806b1613",
  arbitrumAddress: "0xC175b8abba483e57d36b7EBd9b4d3fBf630FECCA",
  optimismAddress: "0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e",
};

export default function SetTokenDataPage() {
  const [formData, setFormData] = useState(defaultFormData);

  const { writeContractAsync } = useWriteContract();

  const { switchChainAsync } = useSwitchChain();

  const { destinationChain } = useEquitoVote();

  const onClickSetTokenData = async () => {
    try {
      await switchChainAsync({ chainId: destinationChain.definition.id });
      const hash = await writeContractAsync({
        address: destinationChain.equitoVoteContractV2 as Address,
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
        chainId: destinationChain.definition.id,
      });
      await waitForTransactionReceipt(config, {
        hash,
        chainId: destinationChain.definition.id,
      });
    } catch (error) {
      console.error(error);
    }
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
          disabled={!Object.values(formData).every(Boolean)}
        >
          Add Token
        </button>
      </div>
    </div>
  );
}
