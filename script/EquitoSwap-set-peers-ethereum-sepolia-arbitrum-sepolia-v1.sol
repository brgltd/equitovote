// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";

import {EquitoSwap} from "../src/EquitoSwap.sol";
import {EquitoMessageLibrary} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract SetPeers is Script {
	address public constant ethereumSepoliaAddress = 0x27eEb830986B44eC05e78912Ee9A0CB9820211bb;

	address public constant arbitrumSepoliaAddress = 0x496667E89C15409e9a1E7e0f2D15DcDFac430300;

	function run() external {
		EquitoSwap equitoSwap = EquitoSwap(ethereumSepoliaAddress);

		uint256[] memory chainSelectors = new uint256[](2);
		chainSelectors[0] = 1; // Ethereum
		chainSelectors[1] = 4; // Arbitrum

		bytes64[] memory addresses = new bytes64[](2);
		addresses[0] = EquitoMessageLibrary.addressToBytes64(address(ethereumSepoliaAddress));
		addresses[1] = EquitoMessageLibrary.addressToBytes64(address(arbitrumSepoliaAddress));

		uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
		vm.startBroadcast(deployerPrivateKey);

		equitoSwap.setPeers(chainSelectors, addresses);
		
		vm.stopBroadcast();
	}
}

