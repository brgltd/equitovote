// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {VoteSphereToken} from "../src/VoteSphereToken.sol";

contract DeployVoteSphereToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        console.log("deploying VoteSphereToken");
        VoteSphereToken voteSphereToken = new VoteSphereToken();
        console.log("VoteSphereToken deployed to", address(voteSphereToken));

        vm.stopBroadcast();
    }
}
