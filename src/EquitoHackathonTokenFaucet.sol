// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IEquitoHackathonToken {
    function mintFromFaucet(address to) external;
}

contract EquitoHackathonTokenFaucet is ReentrancyGuard {
    uint256 private constant COOLDOWN = 1 hours;

    mapping(address user => uint256 timestamp) timestamps;

    error CooldownNotFinished(uint256 timestamp);

    function drip(address equitoHackathonToken) external nonReentrant {
        uint256 userTimestamp = timestamps[msg.sender];
        if (block.timestamp <= userTimestamp + COOLDOWN) {
            revert CooldownNotFinished(userTimestamp);
        }
        IEquitoHackathonToken(equitoHackathonToken).mintFromFaucet(msg.sender);
        timestamps[msg.sender] = block.timestamp;
    }
}
