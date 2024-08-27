// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";

import {EquitoSwap} from "../src/EquitoSwap.sol";
import {EquitoMessageLibrary, bytes64} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract HealthcheckSetPeers is Script {
	address payable public constant ethereumSepoliaAddress = payable(0xDb8a55b811DEBBe5cd28a1db7E78f0fE5d282862);

	address payable public constant arbitrumSepoliaAddress = payable(0xCD7949891D3075EF8681b9624746Ea78a5C27aa4);

	function run() external {
		EquitoSwap equitoSwap = EquitoSwap(arbitrumSepoliaAddress);

		uint256[] memory chainSelectors = new uint256[](2);
		chainSelectors[0] = 1004; // Arbitrum
		chainSelectors[1] = 1001; // Ethereum

		bytes64[] memory addresses = new bytes64[](2);
		addresses[0] = EquitoMessageLibrary.addressToBytes64(address(arbitrumSepoliaAddress));
		addresses[1] = EquitoMessageLibrary.addressToBytes64(address(ethereumSepoliaAddress));

		uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
		vm.startBroadcast(deployerPrivateKey);

		equitoSwap.setPeers(chainSelectors, addresses);
		
		vm.stopBroadcast();
	}
}

