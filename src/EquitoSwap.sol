// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {bytes64, EquitoMessage, EquitoMessageLibrary} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract EquitoSwap  is EquitoApp {
	/// @notice Inittializes the contract with the router contract.
	/// @param _router The address of the equito router contract.
	constructor(address _router) EquitoApp(_router) {}
}

