// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {RouterTestnetAddresses} from "../src/RouterTestnetAddresses.sol";
import {EquitoVote} from "../src/EquitoVote.sol";

contract DeployEquitoVote is Script {
    string constant DEPLOYED_TO_ETHEREUM_SEPOLIA = "ETHEREUM_SEPOLIA";

    string constant DEPLOYED_TO_ARBITRUM_SEPOLIA = "ARBITRUM_SEPOLIA";

    string constant DEPLOYED_TO_OPTIMISM_SEPOLIA = "OPTIMISM_SEPOLIA";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address routerAddress = getChain();

        vm.startBroadcast(deployerPrivateKey);

        console.log("deploying EquitoVote");
        EquitoVote equitoVote = new EquitoVote(routerAddress);
        console.log("EquitoVote deployed to", address(equitoVote));

        vm.stopBroadcast();
    }

    function getChain() private view returns (address) {
        string memory deployedTo = vm.envString("DEPLOYED_TO");
        if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(DEPLOYED_TO_ETHEREUM_SEPOLIA))
        ) {
            return RouterTestnetAddresses.ETHEREUM_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(DEPLOYED_TO_ARBITRUM_SEPOLIA))
        ) {
            return RouterTestnetAddresses.ARBITRUM_SEPOLIA;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(DEPLOYED_TO_OPTIMISM_SEPOLIA))
        ) {
            return RouterTestnetAddresses.OPTIMISM_SEPOLIA;
        }
        revert("Invalid DEPLOYED_TO");
    }
}
