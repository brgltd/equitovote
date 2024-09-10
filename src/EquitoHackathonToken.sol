// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

contract EquitoHackathonToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    uint256 public amountFaucetToMint = 1_000e18;

    address public faucet;

    error OnlyFaucet(address caller);

    modifier onlyFaucet() {
        if (msg.sender != faucet) {
            revert OnlyFaucet(msg.sender);
        }
        _;
    }

    constructor(
        address startingFaucet
    )
        ERC20("EquitoHackathonToken", "EHT")
        ERC20Permit("EquitoHackathonToken")
        Ownable(msg.sender)
    {
        faucet = startingFaucet;
        _mint(msg.sender, 1_000_000e18);
    }

    function mint(address to, uint256 amount) public virtual onlyOwner {
        _mint(to, amount);
    }

    function mintFromFaucet(address to) external onlyFaucet {
        _mint(to, amountFaucetToMint);
    }

    function updateFaucet(address newFaucet) external onlyOwner {
        faucet = newFaucet;
    }

    function updateAmountFaucetToMint(
        uint256 newAmountFaucetToMint
    ) external onlyOwner {
        amountFaucetToMint = newAmountFaucetToMint;
    }

    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(
        address owner
    ) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
