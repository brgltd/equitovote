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
import { chains } from "../../utils/chains";
import { config } from "../../utils/wagmi";
import { useRouter } from "../../hooks/use-router";
import { useApprove } from "../../hooks/use-approve";
import { useDeliver } from "../../hooks/use-deliver";
import { Addresses } from "../../addresses";
import healthcheckContract from "../../out/Healthcheck.sol/Healthcheck.json";

const healthcheckAbi = healthcheckContract.abi;

const ethereumChain = chains.find((chain) => chain.name === "Ethereum Sepolia");
const arbitrumChain = chains.find((chain) => chain.name === "Arbitrum Sepolia");

export default function Page() {
  const [isClient, setIsClient] = useState(false);

  const [message, setMessage] = useState("");

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
    args: [Addresses.EquitoSwap_EthereumSepolia_V1],
    query: { enabled: !!fromRouterAddress },
    chainId: ethereumChain.definition.id,
  });

  const { data: toFee } = useReadContract({
    address: toRouterAddress,
    abi: routerAbi,
    functionName: "getFee",
    args: [Addresses.EquitoSwap_ArbitrumSepolia_V1],
    query: { enabled: !!toRouterAddress },
    chainId: arbitrumChain.definition.id,
  });

  //   // ethereum -> arbitrum
  //   const { data: peers } = useReadContract({
  //     address: Config.EquitoSwap_EthereumSepolia_V1,
  //     abi: healthcheckAbi,
  //     functionName: "peers",
  //     args: [1004],
  //     chainId: ethereumChain.definition.id,
  //   });

  //   // arbitrum -> ethereum
  //   const { data: arbitrumPeers } = useReadContract({
  //     address: Config.EquitoSwap_ArbitrumSepolia_V1,
  //     abi: healthcheckAbi,
  //     functionName: "peers",
  //     args: [1001],
  //     chainId: arbitrumChain.definition.id,
  //   });

  /* console.log("ethereum peers"); */
  /* console.log(peers); */

  /* console.log("arbitrum peers"); */
  /* console.log(arbitrumPeers); */

  const deliverMessage = useDeliver({
    equito: {
      chain: arbitrumChain,
      router: toRouter,
    },
  });

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

  const sendMessage = async () => {
    const hash = await writeContractAsync({
      address: Addresses.Healthcheck_EthereumSepolia_V1,
      abi: healthcheckAbi,
      functionName: "sendMessage",
      args: [
        BigInt(arbitrumChain.chainSelector), // destinationChainSelector
        message, // message
      ],
      value: fromFee,
      chainId: ethereumChain?.definition.id,
    });
    return waitForTransactionReceipt(config, {
      hash,
      chainId: ethereumChain?.definition.id,
    });
  };

  //   const deliverAndExecuteMessage = async (proof, message, messageData) => {
  //     const hash = await writeContractAsync({
  //       address: toRouterAddress,
  //       abi: routerAbi,
  //       functionName: "deliverAndExecuteMessage",
  //       value: toFee,
  //       args: [message, messageData, BigInt(0), proof],
  //       chainId: arbitrumChain.definition.id,
  //     });
  //     return waitForTransactionReceipt(config, {
  //       hash,
  //       chainId: arbitrumChain.definition.id,
  //     });
  //   };

  const onClickSendMessage = async () => {
    try {
      await switchChainAsync({ chainId: ethereumChain.definition.id });

      const sendMessageReceipt = await sendMessage();

      const logs = parseEventLogs({
        abi: routerAbi,
        logs: sendMessageReceipt.logs,
      });

      console.log("logs");
      console.log(logs);

      const sendMessageResult = parseEventLogs({
        abi: routerAbi,
        logs: sendMessageReceipt.logs,
      }).flatMap(({ eventName, args }) =>
        eventName === "MessageSendRequested" ? [args] : [],
      )[0];

      console.log("sendMessageResult");
      console.log(sendMessageResult);

      const { timestamp: sendMessageTimestamp } = await getBlock(config, {
        chainId: ethereumChain.definition.id,
        blockNumber: sendMessageReceipt.blockNumber,
      });

      const { proof: sendMessageProof, timestamp: resultTimestamp } =
        await approve.execute({
          messageHash: generateHash(sendMessageResult.message),
          fromTimestamp: Number(sendMessageTimestamp) * 1000,
          chainSelector: ethereumChain.chainSelector,
        });

      console.log("sendMessageProof");
      console.log(sendMessageProof);

      console.log("resultTimestamp");
      console.log(resultTimestamp);

      // Go to the `to` chain
      await switchChainAsync({ chainId: arbitrumChain.definition.id });

      /* const executionReceipt = await deliverAndExecuteMessage( */
      /*   bridgeTokenProof, */
      /*   bridgeTokenMessage.message, */
      /*   bridgeTokenMessage.messageData */
      /* ); */

      const executionReceipt = await deliverMessage.execute(
        sendMessageProof,
        sendMessageResult.message,
        sendMessageResult.messageData,
        toFee,
      );

      console.log("executionReceipt");
      console.log(executionReceipt);

      const executionMessage = parseEventLogs({
        abi: routerAbi,
        logs: executionReceipt.logs,
      }).flatMap(({ eventName, args }) =>
        eventName === "MessageSendRequested" ? [args] : [],
      )[0];

      console.log("executionMessage");
      console.log(executionMessage);
    } catch (error) {
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
      <div>ethereum from fee: {parsedFromFee}</div>
      <div>arbitrum to fee: {parsedToFee}</div>
      <label htmlFor="message">enter message to send</label>
      <input
        className="text-black"
        id="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <br />
      <button type="button" onClick={onClickSendMessage}>
        send
      </button>
    </>
  );
}
