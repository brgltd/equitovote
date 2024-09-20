// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {AddressesTestnetRouters} from "./AddressesTestnetRouters.sol";
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
            return AddressesTestnetRouters.ETHEREUM_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_ARBITRUM_SEPOLIA))
        ) {
            return AddressesTestnetRouters.ARBITRUM_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_OPTIMISM_SEPOLIA))
        ) {
            return AddressesTestnetRouters.OPTIMISM_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_BASE_SEPOLIA))
        ) {
            return AddressesTestnetRouters.BASE_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_BLAST_SEPOLIA))
        ) {
            return AddressesTestnetRouters.BLAST_SEPOLIA;
        }
        revert("Invalid DEPLOYED_TO");
    }
}
