// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";

import {EquitoVote} from "../src/EquitoVote.sol";
import {RouterTestnetAddresses} from "../src/RouterTestnetAddresses.sol";

contract DeployEquitoVoteEthereumSepoliaV1 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("deploying EquitoVote");
        EquitoVote equitoVote = new EquitoVote(
            RouterTestnetAddresses.ETHEREUM_SEPOLIA
        );
        console.log(
            "deployed EquitoVote to ethereum sepolia",
            address(equitoVote)
        );

        vm.stopBroadcast();
    }
}
