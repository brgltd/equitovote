// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {Healthcheck} from "../src/Healthcheck.sol";
import {RouterTestnetAddresses} from "./RouterTestnetAddresses.sol";

contract HealthcheckDeploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        console.log("deploying Healthcheck");
        Healthcheck healthcheck = new Healthcheck(
            RouterTestnetAddresses.ARBITRUM_SEPOLIA
        );
        console.log(
            "deployed Healthcheck to arbitrum sepolia",
            address(healthcheck)
        );

        vm.stopBroadcast();
    }
}
