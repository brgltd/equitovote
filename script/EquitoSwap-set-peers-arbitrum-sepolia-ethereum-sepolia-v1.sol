// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";

import {EquitoSwap} from "../src/EquitoSwap.sol";
import {EquitoMessageLibrary} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract SetPeers is Script {
	address public constant ethereumSepoliaAddress = 0x27eEb830986B44eC05e78912Ee9A0CB9820211bb;

	address public constant arbitrumSepoliaAddress = 0x496667E89C15409e9a1E7e0f2D15DcDFac430300;

	function run() external {
		EquitoSwap equitoSwap = EquitoSwap(arbitrumSepoliaAddress);

		uint256[] memory chainSelectors = new uint256[](2);
		chainSelectors[0] = 4; // Arbitrum
		chainSelectors[1] = 1; // Ethereum

		bytes64[] memory addresses = new bytes64[](2);
		addresses[0] = EquitoMessageLibrary.addressToBytes64(address(arbitrumSepoliaAddress));
		addresses[1] = EquitoMessageLibrary.addressToBytes64(address(ethereumSepoliaAddress));

		uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
		vm.startBroadcast(deployerPrivateKey);

		equitoSwap.setPeers(chainSelectors, addresses);
		
		vm.stopBroadcast();
	}
}

