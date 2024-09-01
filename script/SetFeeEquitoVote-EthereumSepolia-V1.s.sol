// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script} from "forge-std/Script.sol";
import {EquitoVote} from "../src/EquitoVote.sol";

contract SetFeeEquitoVote_EthereumSepolia_V1 is Script {
    address payable public constant ethereumSepoliaAddress =
        payable(0x403A16CF04124FE6154e009c69a4e58A5B42F0fa);

    function run() external {
        EquitoVote equitoVote = EquitoVote(ethereumSepoliaAddress);

        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        equitoVote.setProtocolFee(0.00001e18);

        vm.stopBroadcast();
    }
}
