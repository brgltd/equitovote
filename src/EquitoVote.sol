// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {
	bytes64, 
	EquitoMessage
} from "equito/src/libraries/EquitoMessageLibrary.sol";
import {
	LibAppStorage,
	AppStorage,
	VoteOption,
	OperationType,
	Proposal
} from "./LibAppStorage.sol";

contract EquitoVote is EquitoApp {
	// --- events ---

	event CreateProposalMessageSent(
		uint256 indexed destinationChainSelector,
		bytes32 messageHash
	);

	event VoteOnProposalMessageSent(
		uint256 indexed destinationChainSelector,
		bytes32 messageHash
	);

	event CreateProposalMessageReceived(bytes32 proposalId);

	event VoteOnProposalMessageReceived(
		bytes32 indexed proposalId,
		uint256 numVotes,
		VoteOption voteOption
	);

	// --- init function ---

	constructor(address _router) EquitoApp(_router) {}

	// --- external mutative functions ---

	function createProposal(
		uint256 destinationChainSelector,
		uint256 endTimestamp,
		address erc20,
		string calldata title,
		string calldata description
	) external payable {
		bytes32 id = keccak256(abi.encode(msg.sender, block.timestamp));

		Proposal memory newProposal = Proposal({
			startTimestamp: block.timestamp,
			endTimestamp: endTimestamp,
			numVotesYes: 0,
			numVotesNo: 0,
			numVotesAbstain: 0,
			erc20: erc20,	
			creator: msg.sender,
			title: title,
			description: description,
			id: id
		});

		bytes64 memory receiver = peers[destinationChainSelector];

		bytes memory messageData = abi.encode(
			OperationType.CreateProposal,
			bytes32(0),
			0,
			VoteOption.Abstain,
			newProposal 
		);

		bytes32 messageHash = router.sendMessage{value: msg.value}(
			receiver,
			destinationChainSelector,
			messageData
		);

		emit CreateProposalMessageSent(destinationChainSelector, messageHash);
	}

	function voteOnProposal(
		uint256 destinationChainSelector,
		bytes32 proposalId, 
		uint256 numVotes, 
		VoteOption voteOption
	) external payable {
		// TODO: add either locking or delegation+snapshot(erc20votes)

		bytes64 memory receiver = peers[destinationChainSelector];

		Proposal memory emptyNewProposal;

		bytes memory messageData = abi.encode(
			OperationType.VoteOnProposal,
			proposalId,
			numVotes,
			voteOption,
			emptyNewProposal 
		);

		bytes32 messageHash = router.sendMessage{value: msg.value}(
			receiver,
			destinationChainSelector,
			messageData
		);

		emit VoteOnProposalMessageSent(destinationChainSelector, messageHash);
	}

	// TODO: complete deleteProposal
	function deleteProposal(bytes32 proposalId) external onlyOwner {}

	// --- external view functions ---

	function getProposalsLength() external view returns (uint256) {
        AppStorage storage store = LibAppStorage.appStorage();
		return store.proposalIds.length;
	}

	/// @notice Build up an array of proposals and return it using the index params.
	/// @param startIndex The start index, inclusive.
	/// @param endIndex The end index, non inclusive.
	/// @return An array with proposal data.
	function getProposalsSlice(
		uint256 startIndex,
		uint256 endIndex
	) external view returns (Proposal[] memory) {
        AppStorage storage store = LibAppStorage.appStorage();
		Proposal[] memory slicedProposals = new Proposal[](endIndex - startIndex);
		bytes32[] memory proposalIds = store.proposalIds;
		for (uint256 i = startIndex; i < endIndex; uncheckedInc(i)) {
			slicedProposals[i] = store.proposals[proposalIds[i]];
		}
		return slicedProposals;
	}

	// --- internal mutative functions ---

	/// @notice Receve the cross chain message on the destination chain.
	function _receiveMessageFromPeer(
		EquitoMessage calldata /* message */,
		bytes calldata messageData
	) internal override {
		(
			OperationType operationType,
			bytes32 proposalId,
			uint256 numVotes, 
			VoteOption voteOption,
			Proposal memory newProposal
		) = abi.decode(
			messageData,
			(OperationType, bytes32, uint256, VoteOption, Proposal)
		);
		if (operationType == OperationType.CreateProposal) {
			_createProposal(newProposal);
			emit CreateProposalMessageReceived(newProposal.id);
		} else if (operationType == OperationType.VoteOnProposal) {
			_voteOnProposal(proposalId, numVotes, voteOption);
			emit VoteOnProposalMessageReceived(proposalId, numVotes, voteOption);
		}
	}

	// --- private mutative functions ---

	function _createProposal(Proposal memory newProposal) private {
        AppStorage storage store = LibAppStorage.appStorage();
		bytes32 proposalId = newProposal.id;
		store.proposalIds.push(proposalId);
		store.proposals[proposalId] = newProposal;
	}

	function _voteOnProposal(
		bytes32 proposalId, 
		uint256 numVotes, 
		VoteOption voteOption
	) private {
        AppStorage storage store = LibAppStorage.appStorage();
		if (voteOption == VoteOption.Yes) {
			store.proposals[proposalId].numVotesYes += numVotes;
		} else if (voteOption == VoteOption.No) {
			store.proposals[proposalId].numVotesNo += numVotes;
		} else if (voteOption == VoteOption.Abstain) {
			store.proposals[proposalId].numVotesAbstain += numVotes;
		}
	}

	// --- private pure functions ---

	/// @notice Unchecked increment to save gas. Should be used primarily on
	///			`for` loops that don't change the value of `i`.
	/// @param i The value to be incremented.
	/// @return The incremeneted value.
	function uncheckedInc(uint256 i) private pure returns (uint256) {
		unchecked {
			return ++i;
		}
	}

	// --- used for diamond testing --- 

	function add(uint256 n1, uint256 n2) external pure returns (uint256) {
		return n1 + n2;
	}
}
