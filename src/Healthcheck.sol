// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {bytes64, EquitoMessage} from "equito/src/libraries/EquitoMessageLibrary.sol";

/// @title Healtcheck
/// @notice Simple contract to check systems are up-and-running.
contract Healthcheck is EquitoApp {
	event MessageSent(uint256 indexed destinationChainSelector, bytes32 messageHash);

	event MessageReceived(uint256 indexed sourceChainSelector, string message);

	constructor(address _router) EquitoApp(_router) {}
	
	function sendMessage(
		uint256 destinationChainSelector,
		string calldata message
	) external payable {
		bytes64 receiver = peers[destinationChainSelector];
		bytes memory messageData = abi.encode(message);
		bytes32 messageHash = router.sendMessage{value: msg.value}(
			receiver,
			destinationChainSelector,
			messageData
		);
		emit MessageSent(destinationChainSelector, messageHash);
	}

	function _receiveMessageFromPeer(
		EquitoMessage calldata message,
		bytes calldata messageData
	) internal override {
		string memory message = abi.decode(messageData, string);
		// string in the event? does that work?
		emit MessageReceived(message.sourceChainSelector, message);
	}
  }
}
