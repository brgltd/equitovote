// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {bytes64, EquitoMessage, EquitoMessageLibrary} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract EquitoSwap  is EquitoApp {
	struct TokenAmount {
		address token;
		uint256 amount;
		address recipient;
	}

    /// @dev The address used to represent the native token.
    address internal constant NATIVE_TOKEN =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

	error InsufficientValueSent();

	/// @notice Inittializes the contract with the router contract.
	/// @param _router The address of the equito router contract.
	constructor(address _router) EquitoApp(_router) {}

	function bridgeNative(
		uint256 destinationChainSelector,
		uint256 sourceAmount
	) external payable {
		if (sourceAmount > msg.value) {
			revert InsufficientValueSent();
		}
		uint256 fee = msg.value - sourceAmount;
		uint256 destinationAmount = sourceAmount - fee;

		TokenAmount memory tokenAmount = TokenAmount({
			token: NATIVE_TOKEN,
			amount: destinationAmount,
			recipient: msg.sender
		});

		bytes32 messageHash = router.sendMessage{value: fee}(
			peers[destinationChainSelector],
			destinationChainSelector,
			abi.encode(tokenAmount)
		);
	}
}

