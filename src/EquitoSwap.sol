// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {bytes64, EquitoMessage} from "equito/src/libraries/EquitoMessageLibrary.sol";
import {TransferHelper} from "./TransferHelper.sol";

contract EquitoSwap  is EquitoApp {
	struct TokenAmount {
		bytes token;
		uint256 amount;
		bytes recipient; 
	}

    /// @dev The address used to represent the native token.
    address internal constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

	event BridgeNativeRequested(
		bytes32 indexed messageHash,
		uint256 indexed destinationChainSelector,
		uint256 sourceAmount,
		uint256 destinationAmount,
		bytes recipient
	);

	error InsufficientValueSent();

	/// @notice Inittializes the contract with the router contract.
	/// @param _router The address of the equito router contract.
	constructor(address _router) EquitoApp(_router) {}

	function bridgeNative(
		uint256 destinationChainSelector,
		uint256 sourceAmount
	) external payable returns (bytes32) {
		if (sourceAmount > msg.value) {
			revert InsufficientValueSent();
		}
		uint256 fee = msg.value - sourceAmount;
		uint256 destinationAmount = sourceAmount - fee;

		bytes memory destinationToken = abi.encodePacked(NATIVE_TOKEN);
		bytes memory recipient = abi.encodePacked(msg.sender);

		TokenAmount memory tokenAmount = TokenAmount({
			token: destinationToken,
			amount: destinationAmount,
			recipient: recipient
		});

		bytes32 messageHash = router.sendMessage{value: fee}(
			peers[destinationChainSelector],
			destinationChainSelector,
			abi.encode(tokenAmount)
		);

		emit BridgeNativeRequested(
			messageHash,
			destinationChainSelector,
			sourceAmount,
			destinationAmount,
			recipient
		);

		return messageHash;
	}

	function _receiveMessageFromPeer(
		EquitoMessage calldata message,
		bytes calldata messageData
	) internal override {
		TokenAmount memory tokenAmount = abi.decode(messageData, (TokenAmount));
		address recipient = abi.decode(tokenAmount.recipient, (address));
		address token = abi.decode(tokenAmount.token, (address));
		if (token == NATIVE_TOKEN) {
			TransferHelper.safeTransferETH(recipient, tokenAmount.amount);
		}
	}
}

