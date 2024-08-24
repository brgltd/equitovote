"use client";

import { useState, useEffect } from "react";
import {
  useSwitchChain,
  useWriteContract,
  useReadContract,
  useAccount,
} from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { formatUnits } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { routerAbi } from "@equito-sdk/evm";
import { chains } from "../utils/chains";
import { config } from "../utils/wagmi";
import { useRouter } from "../hooks/use-router";
import { Config } from "../config";
import erc20Abi from "../abis/erc20.json";
import equitoSwap from "../out/EquitoSwap.sol/EquitoSwap.json";

const equitoSwapAbi = equitoSwap.abi;

// TODO: replace with chain select.
const ethereumChain = chains.find((chain) => chain.name === "Ethereum Sepolia");
const arbitrumChain = chains.find((chain) => chain.name === "Arbitrum Sepolia");

export default function Page() {
  const [isClient, setIsClient] = useState(false);

  const [inputAmount, setInputAmount] = useState("");

  const { switchChainAsync } = useSwitchChain();

  const { address: userAddress } = useAccount();

  const { writeContractAsync } = useWriteContract();

  const fromRouter = useRouter({ chainSelector: ethereumChain.chainSelector });
  const fromRouterAddress = fromRouter.data;

  const { data: fromFee } = useReadContract({
  	address: fromRouterAddress,
	abi: routerAbi,
	functionName: "getFee",
	args: [Config.EquitoSwap_EthereumSepolia_V1],
	query: { enabled: !!fromRouterAddress },
	chainId: ethereumChain.definition.id,
  });

  const parsedFromFee = fromFee ? `${Number(formatUnits(fromFee, 18)).toFixed(8)} ${ethereumChain.definition.nativeCurrency.symbol}`: "unavailable";

  useEffect(() => {
    setIsClient(true);
  }, []);

  const approveLink = async () => {
    const hash = await writeContractAsync({
      address: Config.Link_EthereumSepolia,
      abi: erc20Abi,
      functionName: "approve",
      // approve 25 link
      args: [Config.EquitoSwap_EthereumSepolia_V1, "25000000000000000000"],
    });
    await waitForTransactionReceipt(config, { hash });
  };

  const bridgeEquitoSwap = async () => {
	const hash = await writeContractAsync({
		address: Config.EquitoSwap_EthereumSepolia_V1,
		abi: equitoSwapAbi,
		functionName: "bridgeERC20",
		args: [
			arbitrumChain.chainSelector, // destinationChainSelector
			Config.Link_EthereumSepolia, // sourceToken
			"1000000000000000000", // sourceAmount
		],
		value: fromFee || 0,
	});
	await waitForTransactionReceipt(config, { hash });
  };

  const onClickSwap = async () => {
    try {
      await switchChainAsync({ chainId: ethereumChain.definition.id });

      // ERC20 approve EquitoSwap to use funds from msg.sender.
	  // TODO: only call if equitoSwap allowance does not cover input
      /* await approveLink(); */

	  await bridgeEquitoSwap();
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
      {isClient && userAddress ? `address: ${userAddress}` : "not connected"}
      <br />

      {/* assume ether from ethereum to arbitrum */}
	  <div>from fee: {parsedFromFee}</div>
      <label htmlFor="input-token">enter input amount</label>
      <input
        className="text-black"
        id="input-token"
        value={inputAmount}
        onChange={(e) => setInputAmount(e.target.value)}
      />
      <br />
      <button className="block" onClick={onClickSwap}>
        send
      </button>
    </>
  );
}
