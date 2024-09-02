// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {EquitoVote} from "../src/EquitoVote.sol";

contract DeployEquitoVote is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address routerAddress = vm.envAddress("EQUITO_ROUTER");

        vm.startBroadcast(deployerPrivateKey);

        console.log("deploying EquitoVote");
        EquitoVote equitoVote = new EquitoVote(routerAddress);
        console.log("EquitoVote deployed to", address(equitoVote));

        vm.stopBroadcast();
    }
}
