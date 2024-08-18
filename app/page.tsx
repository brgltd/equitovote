"use client";

import { useState } from "react";
import { useSwitchChain } from "wagmi";
import { chains } from "../utils/chains";

// TODO: replace with chain select.
const ethereumChain = chains.find((chain) => chain.name === "Ethereum Sepolia");
const arbitrumChain = chains.find((chain) => chain.name === "Arbitrum Sepolia");

export default function Page() {
	const [inputAmount, setInputAmount] = useState("");

	const { switchChainAsync } = useSwitchChain();

	const onClickSwap = async () => {
		try {
			await switchChainAsync({ chainId: ethereumChain.definition.id });
		} catch (error) {
			// TODO: show a toast with the error
			console.error(error);
		}
	}

	return (
		<>
			{/* assume ether from ethereum to arbitrum */}
			<label htmlFor="input-token">enter input amount</label>
			<input
				className="text-black"
				id="input-token" 
				value={inputAmount}
				onChange={e => setInputAmount(e.target.value)}
			/>
			<br />
			<button className="block">send</button>
		</>
	);
}

