// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {DiamondCutFacet} from "../src/DiamondCutFacet.sol";

contract DeployDiamondCutFacet is Script {
    function run() external {
        vm.startBroadcast();
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        vm.stopBroadcast();

        console.log("DiamondCutFacet deployed at:", address(diamondCutFacet));
    }
}
