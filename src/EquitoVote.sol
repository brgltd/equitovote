// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {bytes64, EquitoMessage} from "equito/src/libraries/EquitoMessageLibrary.sol";

contract EquitoVote is EquitoApp {
	struct Election {
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

	Election[] private elections;

	constructor(address _router) EquitoApp(_router) {}

	function createElection(
		uint256 endTimestamp,
		address erc20,
		string calldata title,
		string calldata description
	) external payable {
		bytes32 id = keccak256(abi.encode(msg.sender, block.timestamp));
		Election memory newElection = Election({
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
		elections.push(newElection);
	}

	function voteForElection(
		bytes32 id, 
		uint256 numVotes, 
		VoteOption voteOption
	) external payable {
		// assume no delegation now for simplicity
		// probably need a mapping to reference that id
	}

	function deleteElection(bytes32 id) external onlyOwner {}

	function getElectionsLength() external view returns (uint256) {
		return elections.length;
	}

	function getElectionsSlice(
		uint256 startIndex,
		uint256 endIndex
	) external view returns (Election[] memory) {
		// Build up the array using the indexes
	}
}
