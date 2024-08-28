// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {
	bytes64, 
	EquitoMessage
} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract EquitoVote is EquitoApp {
	// --- types ----

	struct Proposal {
		uint256 startTimestamp;
		uint256 endTimestamp;
		uint256 numVotesYes;
		uint256 numVotesNo;
		uint256 numVotesAbstain;
		address erc20;
		address creator;
		string title;
		string description;
		bytes32 id;
	}

	enum VoteOption {
		Yes,
		No,
		Abstain
	} 

	// --- state variables ---

	bytes32[] private proposalIds;

	mapping(bytes32 id => Proposal) private proposals;

	// --- init function ---

	constructor(address _router) EquitoApp(_router) {}

	// --- external mutative functions ---

	function createProposal(
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
		proposalIds.push(id);
		proposals[id] = newProposal;
	}

	function voteOnProposal(
		bytes32 id, 
		uint256 numVotes, 
		VoteOption voteOption
	) external payable {
		// assume no delegation now for simplicity
		if (voteOption == VoteOption.Yes) {
			proposals[id].numVotesYes += numVotes;
		} else if (voteOption == VoteOption.No) {
			proposals[id].numVotesNo += numVotes;
		} else {
			proposals[id].numVotesAbstain += numVotes;
		}
	}

	function deleteProposal(bytes32 id) external onlyOwner {}

	// --- external view functions ---

	function getProposalsLength() external view returns (uint256) {
		return proposalIds.length;
	}

	/// @notice Build up the array of proposals and return it using the index params
	/// @param startIndex The start index, inclusive
	/// @param endIndex The end index, non inclusive
	/// @return An array with proposal data
	function getProposalsSlice(
		uint256 startIndex,
		uint256 endIndex
	) external view returns (Proposal[] memory) {
		Proposal[] memory slicedProposals = new Proposal[](endIndex - startIndex);
		for (uint256 i = startIndex; i < endIndex; uncheckedInc(i)) {
			slicedProposals[i] = proposals[proposalIds[i]];
		}
		return slicedProposals;
	}

	// --- internal mutative functions ---

	// function _receiveMessageFromPeer(
	// 	EquitoMessage calldata message,
	// 	bytes calldata messageData
	// ) internal override {}

	// --- internal pure functions ---

	/// @notice Unchecked increment to sae gas. Should be used primarily on
	///			for loops that don't change the value of i.
	/// @param i The value to be incremented
	/// @return The incremeneted value
	function uncheckedInc(uint256 i) internal pure returns (uint256) {
		unchecked {
			return ++i;
		}
	}
}

