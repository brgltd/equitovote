"use client";

import { useState, useEffect } from "react";
import {
  useSwitchChain,
  useWriteContract,
  useReadContract,
  useAccount,
} from "wagmi";
import { waitForTransactionReceipt, getBlock } from "@wagmi/core";
import { formatUnits, parseEventLogs } from "viem";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { routerAbi } from "@equito-sdk/evm";
import { generateHash } from "@equito-sdk/viem";
import { chains } from "../utils/chains";
import { config } from "../utils/wagmi";
import { useRouter } from "../hooks/use-router";
import { useApprove } from "../hooks/use-approve";
import { useDeliver } from "../hooks/use-deliver";
import { Config } from "../config";
import erc20Abi from "../abis/erc20.json";
import equitoSwap from "../out/EquitoSwap.sol/EquitoSwap.json";

const equitoSwapAbi = equitoSwap.abi;

// TODO: replace with chain select.
const ethereumChain = chains.find((chain) => chain.name === "Ethereum Sepolia");
const arbitrumChain = chains.find((chain) => chain.name === "Arbitrum Sepolia");

enum Status {}

export default function Page() {
  const [isClient, setIsClient] = useState(false);

  const [inputAmount, setInputAmount] = useState("");

  const { switchChainAsync } = useSwitchChain();

  const { address: userAddress } = useAccount();

  const { writeContractAsync } = useWriteContract();

  const fromRouter = useRouter({ chainSelector: ethereumChain.chainSelector });
  const toRouter = useRouter({ chainSelector: arbitrumChain.chainSelector });
  const fromRouterAddress = fromRouter.data;
  const toRouterAddress = toRouter.data;

  const approve = useApprove();

  const { data: fromFee } = useReadContract({
    address: fromRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [Config.EquitoSwap_EthereumSepolia_V1],
    query: { enabled: !!fromRouterAddress },
    chainId: ethereumChain.definition.id,
  });

  const { data: toFee } = useReadContract({
    address: toRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [Config.EquitoSwap_ArbitrumSepolia_V1],
    query: { enabled: !!toRouterAddress },
    chainId: arbitrumChain.definition.id,
  });

  const { data: peers } = useReadContract({
  	address: Config.EquitoSwap_EthereumSepolia_V1,
		abi: equitoSwapAbi,
		functionName: "peers",
		args: [1004],
		chainId: ethereumChain.definition.id,
  });

  const { data: arbitrumPeers } = useReadContract({
  	address: Config.EquitoSwap_ArbitrumSepolia_V1,
		abi: equitoSwapAbi,
		functionName: "peers",
		args: [1001],
		chainId: arbitrumChain.definition.id,
  });

	const deliverSwap = useDeliver({ equito:{
		chain: arbitrumChain,
		router: toRouter,
	}});

  /* console.log("ethereum peers"); */
  /* console.log(peers); */

	/* console.log("arbitrum peers"); */
	/* console.log(arbitrumPeers); */

  const parsedFromFee = fromFee
    ? `${Number(formatUnits(fromFee, 18)).toFixed(8)} ${
        ethereumChain?.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

  const parsedToFee = toFee
    ? `${Number(formatUnits(toFee, 18)).toFixed(8)} ${
        arbitrumChain?.definition?.nativeCurrency?.symbol
      }`
    : "unavailable";

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

  const bridgeToken = async () => {
    const hash = await writeContractAsync({
      address: Config.EquitoSwap_EthereumSepolia_V1,
      abi: equitoSwapAbi,
      functionName: "bridgeERC20",
      args: [
        BigInt(arbitrumChain.chainSelector), // destinationChainSelector
        Config.Link_EthereumSepolia, // sourceToken
        "0100000000000000000", // sourceAmount, 0.1 link
      ],
      value: fromFee || 0,
      chainId: ethereumChain?.definition.id,
    });
    return waitForTransactionReceipt(config, {
      hash,
      chainId: ethereumChain?.definition.id,
    });
  };

  const deliverAndExecuteMessage = async (proof, message, messageData) => {
    const hash = await writeContractAsync({
      address: toRouterAddress,
      abi: routerAbi,
      functionName: "deliverAndExecuteMessage",
      value: toFee,
      args: [message, messageData, BigInt(0), proof],
      chainId: arbitrumChain.definition.id,
    });
    return waitForTransactionReceipt(config, {
      hash,
      chainId: arbitrumChain.definition.id,
    });
  };

  const onClickSwap = async () => {
    try {
      await switchChainAsync({ chainId: ethereumChain.definition.id });

      // ERC20 approve EquitoSwap to use funds from msg.sender.
      // TODO: only call if equitoSwap allowance does not cover input
      /* await approveLink(); */

      const bridgeTokenReceipt = await bridgeToken();

      const logs = parseEventLogs({
        abi: routerAbi,
        logs: bridgeTokenReceipt.logs,
      });

      console.log("logs");
      console.log(logs);

      const bridgeTokenMessage = parseEventLogs({
        abi: routerAbi,
        logs: bridgeTokenReceipt.logs,
      }).flatMap(({ eventName, args }) =>
        eventName === "MessageSendRequested" ? [args] : []
      )[0];

      console.log("bridgeTokenMessage");
      console.log(bridgeTokenMessage);

      const { timestamp: bridgeTokenTimestamp } = await getBlock(config, {
        chainId: ethereumChain.definition.id,
        blockNumber: bridgeTokenReceipt.blockNumber,
      });

      const { proof: bridgeTokenProof, timestamp: resultTimestamp } =
        await approve.execute({
          messageHash: generateHash(bridgeTokenMessage.message),
          fromTimestamp: Number(bridgeTokenTimestamp) * 1000,
          chainSelector: ethereumChain.chainSelector,
        });

      console.log("bridgeTokenProof");
      console.log(bridgeTokenProof);

      console.log("resultTimestamp");
      console.log(resultTimestamp);

      // Go to the `to` chain
      await switchChainAsync({ chainId: arbitrumChain.definition.id });

			// txLink is correct, but crashing here now

      /* const executionReceipt = await deliverAndExecuteMessage( */
      /*   bridgeTokenProof, */
      /*   bridgeTokenMessage.message, */
      /*   bridgeTokenMessage.messageData */
      /* ); */

			const executionReceipt = await deliverSwap.execute(
				bridgeTokenProof,
				bridgeTokenMessage.message,
				bridgeTokenMessage.messageData,
				toFee,
			);

      console.log("executionReceipt");
      console.log(executionReceipt);

      const executionMessage = parseEventLogs({
        abi: routerAbi,
        logs: executionReceipt.logs,
      }).flatMap(({ eventName, args }) =>
        eventName === "MessageSendRequested" ? [args] : []
      )[0];

      console.log("executionMessage");
      console.log(executionMessage);
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
      <div>ethereum from fee: {parsedFromFee}</div>
      <div>arbitrum to fee: {parsedToFee}</div>
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
