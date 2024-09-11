// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {Router} from "equito/src/Router.sol";
import {MockVerifier} from "equito/test/mock/MockVerifier.sol";
import {MockEquitoFees} from "equito/test/mock/MockEquitoFees.sol";
import {bytes64, EquitoMessage, EquitoMessageLibrary} from "equito/src/libraries/EquitoMessageLibrary.sol";
import {EquitoVoteV2} from "../src/EquitoVoteV2.sol";

contract EquitoVoteTest is Test {
    Router private router;
    MockVerifier private verifier;
    MockEquitoFees private fees;
    EquitoVoteV2 private equitoVoteV2;

    address private sender = address(0xa0);
    address private equitoAddress = address(0xe0);

    address private peer1 = address(0x01);
    address private peer2 = address(0x02);

    function setUp() public {
        vm.prank(sender);
        verifier = new MockVerifier();
        fees = new MockEquitoFees();
        router = new Router(
            0, // Local chainSelector
            address(verifier),
            address(fees),
            EquitoMessageLibrary.addressToBytes64(equitoAddress)
        );

        equitoVoteV2 = new EquitoVoteV2(address(router));

        uint256[] memory chainSelectors = new uint256[](2);
        chainSelectors[0] = 1;
        chainSelectors[1] = 2;

        bytes64[] memory addresses = new bytes64[](2);
        addresses[0] = EquitoMessageLibrary.addressToBytes64(peer1);
        addresses[1] = EquitoMessageLibrary.addressToBytes64(peer2);

        equitoVoteV2.setPeers(chainSelectors, addresses);

        vm.deal(address(sender), 10 ether);
    }

    function testSetTokenData() public {
        string memory tokenName = "VoteSphere";

        uint256[] memory chainSelectors = new uint256[](3);
        chainSelectors[0] = 1001;
        chainSelectors[1] = 1004;
        chainSelectors[2] = 1006;

        address[] memory addresses = new address[](3);
        addresses[0] = 0x2ee891078cc2a08c31e494f19E36F772806b1613;
        addresses[1] = 0xC175b8abba483e57d36b7EBd9b4d3fBf630FECCA;
        addresses[2] = 0x1C04808EE9d755f7B3b2d7fe7933F4Aec8D8Ee0e;

        equitoVoteV2.setTokenData(tokenName, chainSelectors, addresses);

        for (uint256 i = 0; i < addresses.length; ++i) {
            assertEq(
                equitoVoteV2.tokenData(tokenName, chainSelectors[i]),
                addresses[i]
            );
        }
    }
}
