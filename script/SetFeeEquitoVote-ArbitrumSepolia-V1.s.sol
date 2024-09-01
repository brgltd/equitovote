// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {EquitoVote} from "../src/EquitoVote.sol";

contract SetFeeEquitoVote_ArbitrumSepolia_V1 is Script {
    address payable public constant arbitrumSepoliaAddress =
        payable(0x8e5eC33684DC8eE00A4Df0E8b58d279c9A9bdb3E);

    function run() external {
        EquitoVote equitoVote = EquitoVote(arbitrumSepoliaAddress);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        equitoVote.setProtocolFee(0.00001e18);

        vm.stopBroadcast();
    }
}
