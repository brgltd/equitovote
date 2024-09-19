// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface IGenericToken {
    function mintFromFaucet(address to) external;

    function setFaucet(address newFaucet) external;
}
