// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {RouterTestnetAddresses} from "./RouterTestnetAddresses.sol";
import {ChainNames} from "./ChainNames.sol";
import {EquitoVoteV2} from "../src/EquitoVoteV2.sol";

contract DeployEquitoVoteV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address routerAddress = getRouterAddress();

        vm.startBroadcast(deployerPrivateKey);

        console.log("deploying EquitoVote");
        EquitoVoteV2 equitoVoteV2 = new EquitoVoteV2(routerAddress);
        console.log("EquitoVote deployed to", address(equitoVoteV2));

        vm.stopBroadcast();
    }

    function getRouterAddress() private view returns (address) {
        string memory deployedTo = vm.envString("DEPLOYED_TO");
        if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_ETHEREUM_SEPOLIA))
        ) {
            return RouterTestnetAddresses.ETHEREUM_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_ARBITRUM_SEPOLIA))
        ) {
            return RouterTestnetAddresses.ARBITRUM_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_OPTIMISM_SEPOLIA))
        ) {
            return RouterTestnetAddresses.OPTIMISM_SEPOLIA;
        }
        revert("Invalid DEPLOYED_TO");
    }
}
