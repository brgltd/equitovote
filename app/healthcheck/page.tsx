"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

export default function Healthcheck() {
	const [status, setStatus] = useState("isIdle");

	const [pingMessage, setPingMessage] = useState();
	const [pongMessage, setPongMessage] = useState();

	const [fromChain, setFromChain] = useState();
	const [toChain, setToChain] = useState();

	const {
		mutateAsync: execute,
		isError,
		isPending,
		isSuccess,
		error,
	} = useMutation({
		mutationFn: async () => {
			try {
				setPongMessage(undefined);
			} catch (error) {}
		}
	})

	const sfn = {
		isIdle: (
			<button>
				send ping and receive pong
			</button>
		)
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
			<div>
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
				<div>{pongMessage || "no pong message"}</div>
			</div>
		</div>
	);
}

