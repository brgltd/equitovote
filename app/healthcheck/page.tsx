"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Healthcheck() {
	return (
		<div>
			<h1>test</h1>
			<ConnectButton
				chainStatus="none"
				showBalance={false}
				accountStatus={{
					smallScreen: "avatar",
					largeScreen: "full",
				}}
			/>
		</div>
	);
}

