// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {GenericToken} from "../src/GenericToken.sol";

contract DeployGenericToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        string memory tokenName = vm.envString("TOKEN_NAME");
        string memory tokenSymbol = vm.envString("TOKEN_SYMBOL");

        vm.startBroadcast(deployerPrivateKey);

        GenericToken genericToken = new GenericToken(tokenName, tokenSymbol);
        console.log("deployed", tokenName, "to", address(genericToken));

        genericToken.setFaucet(vm.envAddress("FAUCET"));
        console.log("added faucet for", tokenName);

        vm.stopBroadcast();
    }
}
