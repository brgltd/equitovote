// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {IGenericToken} from "../src/IGenericToken.sol";

contract SetFaucet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        IGenericToken(vm.envAddress("TOKEN_TO_SET_FAUCET")).setFaucet(
            vm.envAddress("FAUCET")
        );

        vm.stopBroadcast();
    }
}
