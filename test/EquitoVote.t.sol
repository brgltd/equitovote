// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Test} from "forge-std/Test.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Router} from "equito/src/Router.sol";
import {MockVerifier} from "equito/test/mock/MockVerifier.sol";
import {MockEquitoFees} from "equito/test/mock/MockEquitoFees.sol";
import {bytes64, EquitoMessage, EquitoMessageLibrary} from "equito/src/libraries/EquitoMessageLibrary.sol";
import {EquitoVote} from "../src/EquitoVote.sol";

contract EquitoVoteTest is Test {
    Router private router;
    MockVerifier private verifier;
    MockEquitoFees private fees;
    EquitoVote private equitoVote;

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

        equitoVote = new EquitoVote(address(router));

        uint256[] memory chainSelectors = new uint256[](2);
        chainSelectors[0] = 1;
        chainSelectors[1] = 2;

        bytes64[] memory addresses = new bytes64[](2);
        addresses[0] = EquitoMessageLibrary.addressToBytes64(peer1);
        addresses[1] = EquitoMessageLibrary.addressToBytes64(peer2);

        equitoVote.setPeers(chainSelectors, addresses);

        vm.deal(address(sender), 10 ether);
    }

    function testCreateProposal() public {
        string memory titleInput = generateTitle(0);
        createProposalAndExecuteMessage(0, titleInput);

        bytes32 proposalId = equitoVote.proposalIds(0);

        // Entire struct
        // (
        //     uint256 startTimestamp,
        //     uint256 endTimestamp,
        //     uint256 numVotesYes,
        //     uint256 numVotesNo,
        //     uint256 numVotesAbstain,
        //     address erc20,
        //     address creator,
        //     string memory title,
        //     string memory description,
        //     bytes32 id
        // ) = equitoVote.proposals(proposalId);

        (, , , , , , , string memory titleResult, , ) = equitoVote.proposals(
            proposalId
        );

        assertEq(titleResult, titleInput);
    }

    function testGetProposalsSlice() public {
        uint256 numOfProposals = 5;
        for (uint256 i = 0; i < numOfProposals; ++i) {
            string memory title = generateTitle(i);
            createProposalAndExecuteMessage(i, title);
        }
        uint256 proposalsLength = equitoVote.getProposalIdsLength();
        assertEq(proposalsLength, numOfProposals);
        EquitoVote.Proposal[] memory slicedProposals = equitoVote
            .getProposalsSlice(0, proposalsLength);
        for (uint256 i = 0; i < proposalsLength; ++i) {
            assertEq(slicedProposals[i].title, generateTitle(i));
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
        address erc20Input = 0x779877A7B0D9E8603169DdbD7836e478b4624789;
        string memory descriptionInput = "description0";
        bytes32 proposalId = keccak256(abi.encode(msg.sender, block.timestamp));

        equitoVote.createProposal{value: fee + 0.1e18}(
            destinationChainSelector,
            endTimestampInput,
            erc20Input,
            titleInput,
            descriptionInput
        );

        EquitoVote.Proposal memory newProposal = EquitoVote.Proposal({
            startTimestamp: block.timestamp,
            endTimestamp: endTimestampInput,
            numVotesYes: 0,
            numVotesNo: 0,
            numVotesAbstain: 0,
            erc20: erc20Input,
            creator: msg.sender,
            title: titleInput,
            description: descriptionInput,
            id: proposalId
        });

        bytes memory messageData = abi.encode(
            EquitoVote.OperationType.CreateProposal,
            bytes32(0),
            0,
            EquitoVote.VoteOption.Abstain,
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
