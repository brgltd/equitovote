// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

enum VoteOption {
    Yes,
    No,
    Abstain
} 

enum OperationType {
    CreateProposal,
    VoteOnProposal
}

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

/// @notice Shared struct used as a storage in the `LibAppStorage` library
struct AppStorage {
	bytes32[] proposalIds;
	mapping(bytes32 id => Proposal) proposals;
}

/// @notice Library used as a shared storage among all protocol libraries
library LibAppStorage {
    ///  @notice Returns `AppStorage` struct used as a shared storage among all libraries
    ///  @return ds `AppStorage` struct used as a shared storage
    function appStorage() internal pure returns (AppStorage storage ds) {
        assembly {
            ds.slot := 0
        }
    }
}
