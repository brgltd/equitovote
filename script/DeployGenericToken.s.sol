// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {GenericToken} from "../src/GenericToken.sol";

contract DeployGenericToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        GenericToken genericToken = new GenericToken(
            vm.envString("TOKEN_NAME"),
            vm.envString("TOKEN_SYMBOL")
        );
        console.log("GenericToken deployed to", address(genericToken));

        genericToken.setFaucet(vm.envAddress("FAUCET"));
        console.log("Successfuly set faucet for token");

        vm.stopBroadcast();
    }
}
