// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {EquitoVote} from "../src/EquitoVote.sol";
import {EquitoMessageLibrary, bytes64} from "equito/src/libraries/EquitoMessageLibrary.sol";
import {ChainNames} from "./ChainNames.sol";

contract SetPeersEquitoVote is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        address payable equitoVoteEthereumSepolia = payable(
            vm.envAddress("EQUITO_VOTE_ETHEREUM_SEPOLIA")
        );

        address payable equitoVoteArbitrumSepolia = payable(
            vm.envAddress("EQUITO_VOTE_ARBITRUM_SEPOLIA")
        );

        address payable equitoVoteOptimismSepolia = payable(
            vm.envAddress("EQUITO_VOTE_OPTIMISM_SEPOLIA")
        );

        EquitoVote equitoVote = EquitoVote(
            getChain(
                equitoVoteEthereumSepolia,
                equitoVoteArbitrumSepolia,
                equitoVoteOptimismSepolia
            )
        );

        uint256[] memory chainSelectors = new uint256[](3);
        chainSelectors[0] = 1001; // Ethereum
        chainSelectors[1] = 1004; // Arbitrum
        chainSelectors[2] = 1006; // Optimism

        bytes64[] memory addresses = new bytes64[](3);
        addresses[0] = EquitoMessageLibrary.addressToBytes64(
            equitoVoteEthereumSepolia
        );
        addresses[1] = EquitoMessageLibrary.addressToBytes64(
            equitoVoteArbitrumSepolia
        );
        addresses[2] = EquitoMessageLibrary.addressToBytes64(
            equitoVoteOptimismSepolia
        );

        vm.startBroadcast(deployerPrivateKey);

        equitoVote.setPeers(chainSelectors, addresses);

        vm.stopBroadcast();
    }

    function getChain(
        address payable equitoVoteEthereumSepolia,
        address payable equitoVoteArbitrumSepolia,
        address payable equitoVoteOptimismSepolia
    ) private view returns (address payable) {
        string memory deployedTo = vm.envString("DEPLOYED_TO");
        if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_ETHEREUM_SEPOLIA))
        ) {
            return equitoVoteEthereumSepolia;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_ARBITRUM_SEPOLIA))
        ) {
            return equitoVoteArbitrumSepolia;
        } else if (
            keccak256(abi.encodePacked(deployedTo)) ==
            keccak256(abi.encodePacked(ChainNames.DEPLOYED_TO_OPTIMISM_SEPOLIA))
        ) {
            return equitoVoteOptimismSepolia;
        }
        revert("Invalid DEPLOYED_TO");
    }
}
