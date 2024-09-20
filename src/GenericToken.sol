// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";

/// @title GenericToken
/// @notice Generic token to create demonstration tokens for the Equito Builder Program.
///         Compatible with ERC20Votes to allow snapshot voting.
contract GenericToken is ERC20, ERC20Permit, ERC20Votes, Ownable {
    /// @notice The amount of tokens the faucet will mint per request.
    uint256 public amountFaucetToMint = 1_000e18;

    /// @notice The address of the faucet contract.
    address public faucet;

    /// @notice Thrown when the caller is not the faucet.
    /// @param caller The address of the unauthorized caller.
    error OnlyFaucet(address caller);

    /// @notice Modifier to allow only the faucet contract to call the function.
    modifier onlyFaucet() {
        if (msg.sender != faucet) {
            revert OnlyFaucet(msg.sender);
        }
        _;
    }

    /// @notice Initializes the GenericToken contract with a name and symbol.
    ///         Mints initial supply to the deployer.
    /// @param name The name of the token.
    /// @param symbol The symbol of the token.
    constructor(
        string memory name,
        string memory symbol
    ) ERC20(name, symbol) ERC20Permit(name) Ownable(msg.sender) {
        _mint(msg.sender, 1_000_000e18);
    }

    /// @notice Mints tokens to the specified address.
    /// @param to The address to receive the minted tokens.
    /// @param amount The amount of tokens to mint.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Mints tokens from the faucet to the specified address.
    /// @param to The address to receive the minted tokens from the faucet.
    function mintFromFaucet(address to) external onlyFaucet {
        _mint(to, amountFaucetToMint);
    }

    /// @notice Sets the faucet address that is allowed to mint tokens.
    /// @param newFaucet The new faucet address.
    function setFaucet(address newFaucet) external onlyOwner {
        faucet = newFaucet;
    }

    /// @notice Updates the amount of tokens the faucet will mint per request.
    /// @param newAmountFaucetToMint The new amount of tokens to mint from the faucet.
    function updateAmountFaucetToMint(
        uint256 newAmountFaucetToMint
    ) external onlyOwner {
        amountFaucetToMint = newAmountFaucetToMint;
    }

    /// @notice Internal function to update token balances during transfers.
    /// @param from The address transferring tokens.
    /// @param to The address receiving tokens.
    /// @param amount The amount of tokens being transferred.
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    /// @notice Returns the current nonce for the specified owner, used for permit signatures.
    /// @param owner The address of the token owner.
    /// @return The current nonce for the owner.
    function nonces(
        address owner
    ) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
