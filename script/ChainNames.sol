// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

/// @notice Chain names that are used to avoid dupplication during deployment.
library ChainNames {
    string public constant DEPLOYED_TO_ETHEREUM_SEPOLIA = "ETHEREUM_SEPOLIA";

    string public constant DEPLOYED_TO_ARBITRUM_SEPOLIA = "ARBITRUM_SEPOLIA";

    string public constant DEPLOYED_TO_OPTIMISM_SEPOLIA = "OPTIMISM_SEPOLIA";

    string public constant DEPLOYED_TO_BASE_SEPOLIA = "BASE_SEPOLIA";

    string public constant DEPLOYED_TO_BLAST_SEPOLIA = "BLAST_SEPOLIA";
}
