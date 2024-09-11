// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IToken {
    function mintFromFaucet(address to) external;
}

contract Faucet is ReentrancyGuard {
    uint256 private constant COOLDOWN = 1 hours;

    mapping(address user => uint256 timestamp) timestamps;

    error CooldownNotFinished(uint256 timestamp);

    function drip(address token) external nonReentrant {
        uint256 userTimestamp = timestamps[msg.sender];
        if (block.timestamp <= userTimestamp + COOLDOWN) {
            revert CooldownNotFinished(userTimestamp);
        }
        IToken(token).mintFromFaucet(msg.sender);
        timestamps[msg.sender] = block.timestamp;
    }
}
