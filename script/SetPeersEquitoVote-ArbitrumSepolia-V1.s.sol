// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {EquitoVote} from "../src/EquitoVote.sol";
import {EquitoMessageLibrary, bytes64} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract SetPeersEquitoVote_ArbitrumSepolia_V1 is Script {
    address payable public constant arbitrumSepoliaAddress =
        payable(0x8e5eC33684DC8eE00A4Df0E8b58d279c9A9bdb3E);

    address payable public constant ethereumSepoliaAddress =
        payable(0x403A16CF04124FE6154e009c69a4e58A5B42F0fa);

    function run() external {
        EquitoVote equitoVote = EquitoVote(arbitrumSepoliaAddress);

        uint256[] memory chainSelectors = new uint256[](2);
        chainSelectors[0] = 1004; // Arbitrum
        chainSelectors[1] = 1001; // Ethereum

        bytes64[] memory addresses = new bytes64[](2);
        addresses[0] = EquitoMessageLibrary.addressToBytes64(
            address(arbitrumSepoliaAddress)
        );
        addresses[1] = EquitoMessageLibrary.addressToBytes64(
            address(ethereumSepoliaAddress)
        );

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        equitoVote.setPeers(chainSelectors, addresses);

        vm.stopBroadcast();
    }
}
