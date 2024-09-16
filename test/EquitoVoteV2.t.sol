// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test, console} from "forge-std/Test.sol";
import {Router} from "equito/src/Router.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {MockVerifier} from "equito/test/mock/MockVerifier.sol";
import {MockEquitoFees} from "equito/test/mock/MockEquitoFees.sol";
import {bytes64, EquitoMessage, EquitoMessageLibrary} from "equito/src/libraries/EquitoMessageLibrary.sol";
import {EquitoVoteV2} from "../src/EquitoVoteV2.sol";

contract EquitoVoteTest is Test {
    Router private router;
    MockVerifier private verifier;
    MockEquitoFees private fees;
    EquitoVoteV2 private equitoVote;

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

        equitoVote = new EquitoVoteV2(address(router));

        uint256[] memory chainSelectors = new uint256[](2);
        chainSelectors[0] = 1;
        chainSelectors[1] = 2;

        bytes64[] memory addresses = new bytes64[](2);
        addresses[0] = EquitoMessageLibrary.addressToBytes64(peer1);
        addresses[1] = EquitoMessageLibrary.addressToBytes64(peer2);

        equitoVote.setPeers(chainSelectors, addresses);

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

        equitoVote.setTokenData(tokenName, chainSelectors, addresses);

        for (uint256 i = 0; i < addresses.length; ++i) {
            assertEq(
                equitoVote.tokenData(tokenName, chainSelectors[i]),
                addresses[i]
            );
        }
    }

    function testCreateProposal() public {
        string memory titleInput = generateTitle(0);
        createProposalAndExecuteMessage(0, titleInput);
        bytes32 proposalId = equitoVote.proposalIds(0);
        (, , , , , string memory titleResult, , , , , ) = equitoVote.proposals(
            proposalId
        );
        assertEq(titleResult, titleInput);
    }

    function testGetSlicedReversedProposals() public {
        string memory titleInput = generateTitle(0);
        createProposalAndExecuteMessage(0, titleInput);
        EquitoVoteV2.Proposal[] memory proposals = equitoVote
            .getSlicedReversedProposals(0, -1);
        assertEq(proposals[0].title, titleInput);
    }

    function testGetSlicedProposals() public {
        uint256 numOfProposals = 5;
        string[] memory titles = new string[](numOfProposals);
        for (uint256 i = 0; i < numOfProposals; ++i) {
            titles[i] = generateTitle(i);
            createProposalAndExecuteMessage(i, titles[i]);
        }
        uint256 proposalsLength = equitoVote.getProposalIdsLength();
        assertEq(proposalsLength, numOfProposals);
        EquitoVoteV2.Proposal[] memory slicedProposals = equitoVote
            .getSlicedProposals(0, proposalsLength);
        for (uint256 i = 0; i < proposalsLength; ++i) {
            assertEq(slicedProposals[i].title, titles[i]);
        }
    }

    function createProposalAndExecuteMessage(
        uint256 timeToAdd,
        string memory titleInput
    ) private {
        vm.warp(block.timestamp + timeToAdd);

        uint256 fee = router.getFee(address(equitoVote));
        uint256 destinationChainSelector = 2;

        uint256 endTimestampInput = block.timestamp + 3600;
        string memory descriptionInput = "description0";
        bytes32 proposalId = keccak256(abi.encode(msg.sender, block.timestamp));

        string memory tokenName = "token name";
        uint256 originChainSelector = 1001;

        equitoVote.createProposal{value: fee + 0.1e18}(
            destinationChainSelector,
            endTimestampInput,
            titleInput,
            descriptionInput,
            tokenName,
            originChainSelector
        );

        EquitoVoteV2.Proposal memory newProposal = EquitoVoteV2.Proposal({
            startTimestamp: block.timestamp,
            endTimestamp: endTimestampInput,
            numVotesYes: 0,
            numVotesNo: 0,
            numVotesAbstain: 0,
            title: titleInput,
            description: descriptionInput,
            id: proposalId,
            tokenName: tokenName,
            startBlockNumber: 0,
            originChainSelector: originChainSelector
        });

        bytes memory messageData = abi.encode(
            EquitoVoteV2.OperationType.CreateProposal,
            newProposal
        );

        EquitoMessage memory message = EquitoMessage({
            blockNumber: 1,
            sourceChainSelector: 2,
            sender: EquitoMessageLibrary.addressToBytes64(peer2),
            destinationChainSelector: 0,
            receiver: EquitoMessageLibrary.addressToBytes64(
                address(equitoVote)
            ),
            hashedData: keccak256(messageData)
        });

        vm.prank(address(sender));
        router.deliverAndExecuteMessage{value: fee}(
            message,
            messageData,
            0,
            abi.encode(1)
        );
    }

    function generateTitle(
        uint256 number
    ) private pure returns (string memory) {
        return string.concat("title", Strings.toString(number));
    }
}
