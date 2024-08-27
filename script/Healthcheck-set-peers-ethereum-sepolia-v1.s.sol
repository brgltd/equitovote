// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {EquitoSwap} from "../src/EquitoSwap.sol";
import {EquitoMessageLibrary, bytes64} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract HealthcheckSetPeers is Script {
	address payable public constant ethereumSepoliaAddress = payable(0xDb8a55b811DEBBe5cd28a1db7E78f0fE5d282862);

	address payable public constant arbitrumSepoliaAddress = payable(0xCD7949891D3075EF8681b9624746Ea78a5C27aa4);

	function run() external {
		EquitoSwap equitoSwap = EquitoSwap(ethereumSepoliaAddress);

		uint256[] memory chainSelectors = new uint256[](2);
		chainSelectors[0] = 1001; // Ethereum
		chainSelectors[1] = 1004; // Arbitrum

		bytes64[] memory addresses = new bytes64[](2);
		addresses[0] = EquitoMessageLibrary.addressToBytes64(ethereumSepoliaAddress);
		addresses[1] = EquitoMessageLibrary.addressToBytes64(arbitrumSepoliaAddress);

		uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
		vm.startBroadcast(deployerPrivateKey);

		equitoSwap.setPeers(chainSelectors, addresses);
		
		vm.stopBroadcast();
	}
}

