// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {EquitoVote} from "../src/EquitoVote.sol";
import {EquitoMessageLibrary, bytes64} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract SetPeersEquitoVote is Script {
    string constant DEPLOYED_TO_ETHEREUM_SEPOLIA = "ETHEREUM_SEPOLIA";

    string constant DEPLOYED_TO_ARBITRUM_SEPOLIA = "ARBITRUM_SEPOLIA";

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address payable equitoVoteEthereumSepolia = payable(
            vm.envAddress("EQUITO_VOTE_ETHEREUM_SEPOLIA")
        );

        address payable equitoVoteArbitrumSepolia = payable(
            vm.envAddress("EQUITO_VOTE_ARBITRUM_SEPOLIA")
        );

        EquitoVote equitoVote = EquitoVote(
            getChain(equitoVoteEthereumSepolia, equitoVoteArbitrumSepolia)
        );

        uint256[] memory chainSelectors = new uint256[](2);
        chainSelectors[0] = 1001; // Ethereum
        chainSelectors[1] = 1004; // Arbitrum

        bytes64[] memory addresses = new bytes64[](2);
        addresses[0] = EquitoMessageLibrary.addressToBytes64(
            equitoVoteEthereumSepolia
        );
        addresses[1] = EquitoMessageLibrary.addressToBytes64(
            equitoVoteArbitrumSepolia
        );

        vm.startBroadcast(deployerPrivateKey);

        equitoVote.setPeers(chainSelectors, addresses);

        vm.stopBroadcast();
    }

    function getChain(
        address payable equitoVoteEthereumSepolia,
        address payable equitoVoteArbitrumSepolia
    ) private view returns (address payable) {
        string memory deployedTo = vm.envString("DEPLOYED_TO");
        if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(DEPLOYED_TO_ETHEREUM_SEPOLIA))
        ) {
            return equitoVoteEthereumSepolia;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(DEPLOYED_TO_ARBITRUM_SEPOLIA))
        ) {
            return equitoVoteArbitrumSepolia;
        }
        revert("Invalid DEPLOYED_TO");
    }
}
