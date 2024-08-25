// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Script.sol";

import {EquitoSwap} from "../src/EquitoSwap.sol";
import {RouterTestnetAddresses} from "../src/RouterTestnetAddresses.sol";

contract DeployEquitoSwap is Script {
	function run() external {
		uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

		vm.startBroadcast(deployerPrivateKey);

		console.log("deploying EquitoSwap");
		EquitoSwap equitoSwap = new EquitoSwap(
			RouterTestnetAddresses.ETHEREUM_SEPOLIA
		);
		console.log("deployed EquitoSwap to ethereum sepolia", address(equitoSwap));

		vm.stopBroadcast();
	}
}

