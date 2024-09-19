// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {RouterTestnetAddresses} from "./RouterTestnetAddresses.sol";
import {ChainNames} from "./ChainNames.sol";
import {EquitoVote} from "../src/EquitoVote.sol";

contract DeployEquitoVote is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address routerAddress = getRouterAddress();

        vm.startBroadcast(deployerPrivateKey);

        EquitoVote equitoVote = new EquitoVote(routerAddress);
        console.log("deployed EquitoVote to", address(equitoVote));

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
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_BASE_SEPOLIA))
        ) {
            return RouterTestnetAddresses.BASE_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_BLAST_SEPOLIA))
        ) {
            return RouterTestnetAddresses.BLAST_SEPOLIA;
        }
        revert("Invalid DEPLOYED_TO");
    }
}
