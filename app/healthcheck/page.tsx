"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { 
	useAccount,
	useSwitchChain,
	useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";
import { toast } from "sonner";
import { formatUnits } from "viem";
import { config } from "../../utils/wagmi";
import { useEquito } from "../../providers/equito-provider";
import { usePingPong } from "../../providers/ping-pong-provider";
import { ChainSelect } from "../../components/chain-select";
import { ProgressLoader } from "../../components/progress-loader";
import { pingPongAbi } from "../../abis/ping-pong.abi";

export default function Healthcheck() {
	const [isClient, setIsClient] = useState(false);

	const { 
		pingMessage,
		setPingMessage,
		pongMessage, 
		setPongMessage, 
		status,
		setStatus, 
		pingFee,
		pongFee 
	} = usePingPong();

	const { address } = useAccount();

	const {
		writeContractAsync,
	} = useWriteContract();

	const { switchChainAsync } = useSwitchChain();

	const { from, to } = useEquito();

	const nativeCurrencyFrom = from?.chain?.definition?.nativeCurrency.symbol; 
	const nativeCurrencyTo = to?.chain?.definition?.nativeCurrency.symbol; 

	useEffect(() => {
		setIsClient(true);
	}, []);

	const sendPing = async () => {
		try {
			await switchChainAsync({ chainId: from.chain.definition.id });
			const hash = await writeContractAsync({
				address: from.chain.pingPongContract,
				abi: pingPongAbi,
				functionName: "sendPing",
				value: pingFee.fee,
				chainId: from.chain.definition.id,
				args: [BigInt(to.chain.chainSelector, pingMessage)],
			});
			return waitForTransactionRecepit(config,
				hash,
				chainId: from.chain.definition.id,
			});
		} catch (error) {
			setStatus(errro);
			console.error(error);
		}
	}

	const {
		mutateAsync: execute,
		isError,
		isPending,
		isSuccess,
		error,
	} = useMutation({
		mutationFn: async () => {
			try {
				if (!from.chain) {
					throw new Error("no from chain found")
				}
				if (!to.chain) {
					throw new Error("no to chain found")
				}
				if (!pongFee.fee == undefined) {
					throw new Error("No pong fee found")
				}
				setStatus("isSendingPing");
				const sendPingReceppt = await sendPing();
			} catch (error) {
				setStatus("isError");
				console.error(error);
			}
		}
	})

	const onClickSendPing = () => {
		toast.promise(execute(), {
			loading: "Executing transaction...",
			success: "Transaction successful",
			error: "Transaction failed",
		});
	};

	const sfn = {
		isIdle: (
			<button onClick={onClickSendPing}>
				send ping and receive pong
			</button>
		),
		isError: (
			<>
				<button onClick={onClickSendPing}>Retry</button>
				<p className="text-destructive text-sm">Ping Pong Error</p>
			</>
		),
		isApprovingSentPing: (
			<>
				<ProgressLoader dir="from" />
				<p className="text-muted-foreground text-sm">
					Approving sent ping message...
				</p>
			</>
		),
	};

	return (
		<div>
			<ConnectButton
				chainStatus="none"
				showBalance={false}
				accountStatus={{
					smallScreen: "avatar",
					largeScreen: "full",
				}}
			/>
			{isClient && address ? `address: ${address}` : "not connected"}

			<div>
				<ChainSelect mode="from" disabled={false} />
				{from?.chain?.name}
				<div>from fee: {pingFee?.fee ? `${Number(formatUnits(pingFee?.fee, 18)).toFixed(8)} ${nativeCurrencyFrom}` : "unavailable"}</div>
				<label htmlFor="ping">ping</label>
				<input
					id="ping"
					placeholder="write your message"
					value={pingMessage ?? ''}
					onChange={(e) => setPingMessage(e.target.value)}
					className="text-black"
				/>
			</div>

			<hr />
			{sfn[status]}		

			<hr />
			<div>
				<ChainSelect mode="to" disabled={false} />
				<div>to fee: {pongFee?.fee ? `${Number(formatUnits(pongFee?.fee, 18)).toFixed(8)} ${nativeCurrencyTo}` : "unavailable"}</div>
				{to?.chain?.name}
				<div>pong</div>
				<div>{pongMessage ?? "no pong message"}</div>
			</div>
		</div>
	);
}

