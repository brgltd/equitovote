// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {Diamond} from "../src/Diamond.sol";

contract DeployDiamond is Script {
    function run() external {
        address owner = msg.sender;

        vm.startBroadcast();
        Diamond diamond = new Diamond(owner);
        vm.stopBroadcast();

        console.log("Diamond deployed at:", address(diamond));
    }
}
