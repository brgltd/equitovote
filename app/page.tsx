"use client";

import { useState, useEffect } from "react";
import {
  useSwitchChain,
  // useContractWrite,
  // usePrepareContractWrite,
  useWriteContract,
  useAccount,
} from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { chains } from "../utils/chains";
import { Config } from "../config";
import { config } from "@/utils/wagmi";
import erc20Abi from "../abis/erc20.json";
import { waitForTransactionReceipt } from "@wagmi/core";

// TODO: replace with chain select.
const ethereumChain = chains.find((chain) => chain.name === "Ethereum Sepolia");
const arbitrumChain = chains.find((chain) => chain.name === "Arbitrum Sepolia");

export default function Page() {
  const [isClient, setIsClient] = useState(false);

  const [inputAmount, setInputAmount] = useState("");

  const { switchChainAsync } = useSwitchChain();

  const { address: userAddress } = useAccount();

  // const { config } = usePrepareContractWrite({
  // 	address: Config.Link_EthereumSepolia,
  // 	abi: erc20Abi,
  // 	functionName: "approve",
  // 	args: [address, '1000000000000000000'],
  // });

  const { writeContractAsync } = useWriteContract();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const approveLink = async () => {
    const hash = await writeContractAsync({
      address: Config.Link_EthereumSepolia,
      abi: erc20Abi,
      functionName: "approve",
      args: [userAddress, "1000000000000000000"],
    });
    await waitForTransactionReceipt(config, { hash });
  };

  const onClickSwap = async () => {
    try {
      await switchChainAsync({ chainId: ethereumChain.definition.id });

      // ERC20 approve EquitoSwap to use funds from msg.sender.
      await approveLink();
    } catch (error) {
      // TODO: show a toast with the error
      console.error(error);
    }
  };

  return (
    <>
      <ConnectButton
        chainStatus="none"
        showBalance={false}
        accountStatus={{
          smallScreen: "avatar",
          largeScreen: "full",
        }}
      />
      {isClient && address ? `address: ${address}` : "not connected"}
      <br />

      {/* assume ether from ethereum to arbitrum */}
      <label htmlFor="input-token">enter input amount</label>
      <input
        className="text-black"
        id="input-token"
        value={inputAmount}
        onChange={(e) => setInputAmount(e.target.value)}
      />
      <br />
      <button className="block">send</button>
    </>
  );
}
