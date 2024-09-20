// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IGenericToken} from "./IGenericToken.sol";

/// @title Faucet
/// @notice Faucet to drip tokens during the Equito Builder Program to
///         facilitate testing.
contract Faucet is ReentrancyGuard, Ownable {
    /// @notice The cooldown period between drips.
    uint256 private constant COOLDOWN = 1 hours;

    /// @notice Indicates whether the cooldown is enabled.
    bool isCooldownEnabled = false;

    /// @notice Tracks the timestamp of the last drip for each user.
    mapping(address user => uint256 timestamp) timestamps;

    /// @notice Emitted when the cooldown feature is updated.
    /// @param isCooldownEnabled Whether cooldown is enabled or disabled.
    event CooldownUpdated(bool isCooldownEnabled);

    /// @notice Thrown when the cooldown period has not finished.
    /// @param timestamp The time when the user can request the next drip.
    error CooldownNotFinished(uint256 timestamp);

    /// @notice Initializes the contract and sets the owner.
    constructor() Ownable(msg.sender) {}

    /// @notice Drips tokens to the caller from the faucet.
    /// @param token The address of the token to drip.
    function drip(address token) external nonReentrant {
        uint256 userTimestamp = timestamps[msg.sender];
        if (isCooldownEnabled && block.timestamp <= userTimestamp + COOLDOWN) {
            revert CooldownNotFinished(userTimestamp);
        }
        IGenericToken(token).mintFromFaucet(msg.sender);
        timestamps[msg.sender] = block.timestamp;
    }

    /// @notice Enables or disables the cooldown feature.
    /// @param newIsCooldownEnabled A boolean indicating whether cooldown is enabled.
    function setIsCooldownEnabled(
        bool newIsCooldownEnabled
    ) external onlyOwner {
        isCooldownEnabled = newIsCooldownEnabled;
        emit CooldownUpdated(newIsCooldownEnabled);
    }
}
