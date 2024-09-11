// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Script, console} from "forge-std/Script.sol";
import {EquitoVoteV2} from "../src/EquitoVoteV2.sol";

contract SetTokenData is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address payable equitoVoteV2Address = payable(
            vm.envAddress("EQUITO_VOTE_OPTIMISM_SEPOLIA")
        );

        EquitoVoteV2 equitoVoteV2 = EquitoVoteV2(equitoVoteV2Address);

        string memory tokenName = "VoteSphere";

        uint256[] memory chainSelectors = new uint256[](3);
        chainSelectors[0] = 1001;
        chainSelectors[1] = 1004;
        chainSelectors[2] = 1006;

        address[] memory addresses = new address[](3);
        addresses[0] = 0x2ee891078cc2a08c31e494f19E36F772806b1613;
        addresses[1] = 0xC175b8abba483e57d36b7EBd9b4d3fBf630FECCA;
        addresses[2] = 0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e;

        vm.startBroadcast(deployerPrivateKey);
        equitoVoteV2.setTokenData(tokenName, chainSelectors, addresses);
        vm.stopBroadcast();

        vm.stopBroadcast();
    }
}
