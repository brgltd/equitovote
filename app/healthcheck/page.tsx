"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { useEquito } from "../../providers/equito-provider";
import { ChainSelect } from "../../components/chain-select";

export default function Healthcheck() {
	const [status, setStatus] = useState("isIdle");

	const [pingMessage, setPingMessage] = useState();
	const [pongMessage, setPongMessage] = useState();

	const [isClient, setIsClient] = useState(false);

	const { from, to } = useEquito();

	const { address } = useAccount();

	useEffect(() => {
		setIsClient(true);
	}, []);

	const {
		mutateAsync: execute,
		isError,
		isPending,
		isSuccess,
		error,
	} = useMutation({
		mutationFn: async () => {
			console.log("start execute");
			try {
				setPongMessage(undefined);
				if (!from.chain) {
					throw new Error("no from chain found")
				}
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
				<label htmlFor="ping">ping</label>
				<input
					id="ping"
					placeholder="write your message"
					value={pingMessage}
					onChange={(e) => setPingMessage(e.target.value)}
				/>
			</div>
			{sfn[status]}		
			<div>
				<div>pong</div>
				<span>{pongMessage ?? "no pong message"}</span>
			</div>
		</div>
	);
}

