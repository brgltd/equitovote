// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IToken {
    function mintFromFaucet(address to) external;
}

contract Faucet is ReentrancyGuard, Ownable {
    uint256 private constant COOLDOWN = 1 hours;

    bool isCooldownEnabled = false;

    mapping(address user => uint256 timestamp) timestamps;

    event CooldownUpdated(bool isCooldownEnabled);

    error CooldownNotFinished(uint256 timestamp);

    constructor() Ownable(msg.sender) {}

    function drip(address token) external nonReentrant {
        uint256 userTimestamp = timestamps[msg.sender];
        if (isCooldownEnabled && block.timestamp <= userTimestamp + COOLDOWN) {
            revert CooldownNotFinished(userTimestamp);
        }
        IToken(token).mintFromFaucet(msg.sender);
        timestamps[msg.sender] = block.timestamp;
    }

    function setIsCooldownEnabled(
        bool newIsCooldownEnabled
    ) external onlyOwner {
        isCooldownEnabled = newIsCooldownEnabled;
        emit CooldownUpdated(newIsCooldownEnabled);
    }
}
