// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {bytes64, EquitoMessage} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract PingPong is EquitoApp {
	event PingSent(
		uint256 indexed destinationChainSelector,
		bytes32 messageHash
	);

	event PongSent(
		uint256 indexed sourceChainSelector,
		bytes32 messageHash
	);

	event PingReceived(
		uint256 indexed sourceChainSelector,
		bytes32 messageHash
	);

	constructor(address _router) EquitoApp(_router) {}
	
	function sendPing(
		uint256 destinationChainSelector,
		string calldata message
	) external payable {
		bytes memory data = abi.encode("ping", message);
		bytes64 memory receiver = peers[destinationChainSelector];
		bytes32 messageHash = router.sendMessage{value: msg.value}(
			receiver,
			destinationChainSelector,
			data
		);
		emit PingSent(destinationChainSelector, messageHash);
	}

	function _receiveMessageFromPeer(
		EquitoMessage calldata message,
		bytes calldata messageData
	) internal override {
		(string memory messageType, string memory payload) = abi.decode(
			messageData,
			(string, string)
		);
		if (keccak256(bytes(messageType)) == keccak256(bytes("ping"))) {
			emit PingReceived(
				message.sourceChainSelector,
				keccak256(abi.encode(message))
			);
			bytes memory data = abi.encode("pong", payload);
			bytes32 messageHash = router.sendMessage{value: msg.value}(
				peers[message.sourceChainSelector],
				message.sourceChainSelector,
				data
			);
			emit PongSent(message.sourceChainSelector, messageHash);
		}
	}
}

