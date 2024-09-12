// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import {EquitoApp} from "equito/src/EquitoApp.sol";
import {bytes64, EquitoMessage} from "equito/src/libraries/EquitoMessageLibrary.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {IVotesExtension} from "./IVotesExtension.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice EquitoVote version 2
contract EquitoVoteV2 is EquitoApp, ReentrancyGuard {
    // --- types ----

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
        string title;
        string description;
        bytes32 id;
        string tokenName;
        // ERC20Votes uses block.number by default for snapshots
        uint256 startBlockNumber;
        // Chain where the proposal was created
        uint256 originChainSelector;
    }

    // --- state variables ---

    // Very small value to simulate a protocol fee for creating proposals during the hackathon
    uint256 public protocolFee = 0.000001e18;

    bytes32[] public proposalIds;

    mapping(bytes32 id => Proposal) public proposals;

    mapping(address user => mapping(bytes32 proposalId => uint256 votes))
        public userVotes;

    mapping(string tokenName => mapping(uint256 chainSelector => address tokenAddress))
        public tokenData;

    string[] public tokenNames;

    // --- events ---

    event CreateProposalMessageSent(
        uint256 indexed destinationChainSelector,
        bytes32 messageHash,
        bytes32 proposalId
    );

    event VoteOnProposalMessageSent(
        uint256 indexed destinationChainSelector,
        bytes32 messageHash
    );

    event CreateProposalMessageReceived(bytes32 proposalId);

    event VoteOnProposalMessageReceived(
        bytes32 indexed proposalId,
        uint256 numVotes,
        VoteOption voteOption
    );

    event ProtocolFeeUpdated(uint256 newProtocolFee);

    event TokenDataUpdated(
        string indexed tokenName,
        uint256[] chainSelectors,
        address[] tokenAddresses
    );

    event TokenDataDeleted(string tokenName, uint256[] chainSelectors);

    event TokenDataUpdated(
        string tokenName,
        uint256 chainSelector,
        address tokenAddress
    );

    // --- errors ---

    error ProposalNotFinished(bytes32 proposalId, uint256 endTimestamp);

    error ProposalInvalid(bytes32 proposalId);

    error CallFailed(address destination);

    error InvalidToken(
        string tokenName,
        uint256 sourceChainSelector,
        address tokenAddress
    );

    error LengthMismatch(
        uint256 chainSelectorsLength,
        uint256 tokenAddressesLength
    );

    error TokenAlreadySet(string tokenName);

    error NotEnoughDelegatedTokens(
        uint256 numberUserVotes,
        uint256 numberUserDelegatedTokens
    );

    // --- init function ---

    constructor(address _router) EquitoApp(_router) {}

    // --- receive function ---

    /// @notice Plain native token transfers to this contract.
    receive() external payable {}

    // --- external mutative user functions ---

    function createProposal(
        uint256 destinationChainSelector,
        uint256 endTimestamp,
        string calldata title,
        string calldata description,
        string calldata tokenName,
        uint256 originChainSelector
    ) external payable nonReentrant {
        bytes32 id = keccak256(abi.encode(msg.sender, block.timestamp));

        Proposal memory newProposal = Proposal({
            startTimestamp: block.timestamp,
            startBlockNumber: block.number,
            endTimestamp: endTimestamp,
            numVotesYes: 0,
            numVotesNo: 0,
            numVotesAbstain: 0,
            title: title,
            description: description,
            id: id,
            tokenName: tokenName,
            originChainSelector: originChainSelector
        });

        bytes memory messageData = abi.encode(
            OperationType.CreateProposal,
            bytes32(0),
            0,
            VoteOption.Abstain,
            address(0),
            newProposal
        );

        bytes32 messageHash = router.sendMessage{
            value: msg.value - protocolFee
        }(
            peers[destinationChainSelector],
            destinationChainSelector,
            messageData
        );

        emit CreateProposalMessageSent(
            destinationChainSelector,
            messageHash,
            id
        );
    }

    function voteOnProposal(
        uint256 destinationChainSelector,
        bytes32 proposalId,
        uint256 numVotes,
        VoteOption voteOption,
        address tokenAddress,
        bool isGetPastVotesEnabled
    ) external payable nonReentrant {
        uint256 numberUserVotes = userVotes[msg.sender][proposalId];

        uint256 numberUserDelegatedTokens = getAmountDelegatedTokens(
            msg.sender,
            tokenAddress,
            proposalId,
            isGetPastVotesEnabled
        );

        if (numVotes + numberUserVotes > numberUserDelegatedTokens) {
            revert NotEnoughDelegatedTokens(
                numberUserVotes,
                numberUserDelegatedTokens
            );
        }

        userVotes[msg.sender][proposalId] += numVotes;

        bytes64 memory receiver = peers[destinationChainSelector];

        uint256 normalizedNumVotes = numVotes /
            10 ** IERC20Metadata(tokenAddress).decimals();

        Proposal memory emptyNewProposal;

        bytes memory messageData = abi.encode(
            OperationType.VoteOnProposal,
            proposalId,
            normalizedNumVotes,
            voteOption,
            tokenAddress,
            emptyNewProposal
        );

        bytes32 messageHash = router.sendMessage{value: msg.value}(
            receiver,
            destinationChainSelector,
            messageData
        );

        emit VoteOnProposalMessageSent(destinationChainSelector, messageHash);
    }

    /// @notice Set token data to be used in proposals.
    /// @dev Will be queried during voting to ensure the provided token matches
    ///		 the proposal token across different chains.
    function setTokenData(
        string calldata tokenName,
        uint256[] memory chainSelectors,
        address[] memory tokenAddresses
    ) external {
        uint256 tokenNamesLength = tokenNames.length;
        for (uint256 i = 0; i < tokenNamesLength; i = uncheckedInc(i)) {
            if (
                keccak256(abi.encode(tokenName)) ==
                keccak256(abi.encode(tokenNames[i]))
            ) {
                revert TokenAlreadySet(tokenName);
            }
        }
        uint256 chainSelectorsLength = chainSelectors.length;
        uint256 tokenAddressesLength = tokenAddresses.length;
        if (chainSelectorsLength != tokenAddressesLength) {
            revert LengthMismatch(chainSelectorsLength, tokenAddressesLength);
        }
        for (uint256 i = 0; i < chainSelectorsLength; i = uncheckedInc(i)) {
            tokenData[tokenName][chainSelectors[i]] = tokenAddresses[i];
        }
        tokenNames.push(tokenName);
        emit TokenDataUpdated(tokenName, chainSelectors, tokenAddresses);
    }

    // --- external mutative admin functions ---

    function setProtocolFee(uint256 newProtocolFee) external onlyOwner {
        protocolFee = newProtocolFee;
        emit ProtocolFeeUpdated(newProtocolFee);
    }

    function updateTokenData(
        string calldata tokenName,
        uint256 chainSelector,
        address tokenAddress
    ) external onlyOwner {
        tokenData[tokenName][chainSelector] = tokenAddress;
        emit TokenDataUpdated(tokenName, chainSelector, tokenAddress);
    }

    function deleteTokenData(
        string calldata tokenName,
        uint256[] memory chainSelectors
    ) external onlyOwner {
        uint256 chainSelectorsLength = chainSelectors.length;
        for (uint256 i = 0; i < chainSelectorsLength; i = uncheckedInc(i)) {
            tokenData[tokenName][chainSelectors[i]] = address(0);
        }
        uint256 tokenNamesLength = tokenNames.length;
        for (uint256 i = 0; i < tokenNamesLength; i = uncheckedInc(i)) {
            if (
                keccak256(abi.encode(tokenName)) ==
                keccak256(abi.encode(tokenNames[i]))
            ) {
                tokenNames[i] = tokenNames[tokenNamesLength - 1];
                break;
            }
        }
        tokenNames.pop();
        emit TokenDataDeleted(tokenName, chainSelectors);
    }

    /// @dev If there are too many proposals, this function can run out of gas.
    ///      In that case, call `deleteProposalByIndexOptimized` which will
    ///      run more efficiently but it will not maintain the array order.
    function deleteProposalById(bytes32 proposalId) external onlyOwner {
        _deleteProposalFromMapping(proposalId);

        uint256 proposalIdIndex = 0;
        uint256 proposalIdsLength = getProposalIdsLength();
        bytes32[] memory proposalIdsCopy = proposalIds;
        for (uint256 i = 0; i < proposalIdsLength; i = uncheckedInc(i)) {
            if (proposalId == proposalIdsCopy[i]) {
                proposalIdIndex = i;
                break;
            }
        }
        _deleteProposalFromListByIndex(
            proposalIdIndex,
            proposalIdsLength,
            proposalIdsCopy
        );
    }

    /// @dev If there are too many proposals, this function can run out of gas.
    ///      In that case, call `deleteProposalByIndexOptimized` which will
    ///      run more efficiently but it will not maintain the array order.
    function deleteProposalByIndex(uint256 proposalIndex) external onlyOwner {
        bytes32[] memory proposalIdsCopy = proposalIds;
        bytes32 proposalIdToDelete = proposalIdsCopy[proposalIndex];
        _deleteProposalFromMapping(proposalIdToDelete);
        _deleteProposalFromListByIndex(
            proposalIndex,
            getProposalIdsLength(),
            proposalIdsCopy
        );
    }

    function deleteProposalByIndexOptimized(
        uint256 proposalIndex
    ) external onlyOwner {
        bytes32[] memory proposalIdsCopy = proposalIds;
        bytes32 proposalIdToDelete = proposalIdsCopy[proposalIndex];
        _deleteProposalFromMapping(proposalIdToDelete);
        uint256 proposalIdsLength = proposalIdsCopy.length;
        if (proposalIndex != proposalIdsLength - 1) {
            proposalIds[proposalIndex] = proposalIdsCopy[proposalIdsLength - 1];
        }
        proposalIds.pop();
    }

    function transferFee(address destination) external onlyOwner {
        (bool success, ) = destination.call{value: address(this).balance}("");
        if (!success) {
            revert CallFailed(destination);
        }
    }

    // --- public view user functions ---

    function getProposalIdsLength() public view returns (uint256) {
        return proposalIds.length;
    }

    // --- private view functions ---

    /// @dev We use `isGetPastVotesEnabled` to control wheather we want to retrive a past voting power
    //       or the current one. For hackathon demonstrations on testnets, we want to enable the current
    //       voting power so that users/judges are able to vote of proposals even if they delegate tokens
    //       after the proposal is created.
    function getAmountDelegatedTokens(
        address user,
        address token,
        bytes32 proposalId,
        bool isGetPastVotesEnabled
    ) public view returns (uint256) {
        return
            isGetPastVotesEnabled
                ? IVotes(token).getPastVotes(
                    user,
                    keccak256(abi.encode(IVotesExtension(token).CLOCK_MODE)) ==
                        keccak256(abi.encode("mode=blocknumber&from=default"))
                        ? proposals[proposalId].startBlockNumber
                        : proposals[proposalId].endTimestamp
                )
                : IVotes(token).getVotes(user);
    }

    /// @notice Build up an array of proposals and return it using the index params.
    /// @param startIndex The start index, inclusive.
    /// @param endIndex The end index, non inclusive.
    /// @return An array with proposal data.
    function getProposalsSlice(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (Proposal[] memory) {
        Proposal[] memory slicedProposals = new Proposal[](
            endIndex - startIndex
        );
        bytes32[] memory proposalIdsCopy = proposalIds;
        for (uint256 i = startIndex; i < endIndex; i = uncheckedInc(i)) {
            slicedProposals[i] = proposals[proposalIdsCopy[i]];
        }
        return slicedProposals;
    }

    function getTokenNamesSlice(
        uint256 startIndex,
        uint256 endIndex
    ) external view returns (string[] memory) {
        string[] memory slicedTokenNames = new string[](endIndex - startIndex);
        string[] memory tokenNamesCopy = tokenNames;
        for (uint256 i = startIndex; i < endIndex; i = uncheckedInc(i)) {
            slicedTokenNames[i] = tokenNamesCopy[i];
        }
        return slicedTokenNames;
    }

    function getTokenNamesLength() external view returns (uint256) {
        return tokenNames.length;
    }

    // --- internal mutative functions ---

    /// @notice Receive the cross chain message on the destination chain.
    function _receiveMessageFromPeer(
        EquitoMessage calldata message,
        bytes calldata messageData
    ) internal override {
        (
            OperationType operationType,
            bytes32 proposalId,
            uint256 numVotes,
            VoteOption voteOption,
            address tokenAddress,
            Proposal memory newProposal
        ) = abi.decode(
                messageData,
                (OperationType, bytes32, uint256, VoteOption, address, Proposal)
            );
        if (operationType == OperationType.CreateProposal) {
            _createProposal(newProposal);
            emit CreateProposalMessageReceived(newProposal.id);
        } else if (operationType == OperationType.VoteOnProposal) {
            _voteOnProposal(
                proposalId,
                numVotes,
                voteOption,
                tokenAddress,
                message.sourceChainSelector
            );
            emit VoteOnProposalMessageReceived(
                proposalId,
                numVotes,
                voteOption
            );
        }
    }

    // --- private mutative functions ---

    function _createProposal(Proposal memory newProposal) private {
        bytes32 proposalId = newProposal.id;
        proposalIds.push(proposalId);
        proposals[proposalId] = newProposal;
    }

    function _voteOnProposal(
        bytes32 proposalId,
        uint256 numVotes,
        VoteOption voteOption,
        address tokenAddress,
        uint256 sourceChainSelector
    ) private {
        string memory tokenName = proposals[proposalId].tokenName;
        if (
            tokenAddress == address(0) ||
            tokenData[tokenName][sourceChainSelector] != tokenAddress
        ) {
            revert InvalidToken(tokenName, sourceChainSelector, tokenAddress);
        }
        if (voteOption == VoteOption.Yes) {
            proposals[proposalId].numVotesYes += numVotes;
        } else if (voteOption == VoteOption.No) {
            proposals[proposalId].numVotesNo += numVotes;
        } else if (voteOption == VoteOption.Abstain) {
            proposals[proposalId].numVotesAbstain += numVotes;
        }
    }

    function _deleteProposalFromMapping(bytes32 proposalIdToDelete) private {
        Proposal memory emptyProposal;
        proposals[proposalIdToDelete] = emptyProposal;
    }

    function _deleteProposalFromListByIndex(
        uint256 proposalIndex,
        uint256 proposalIdsLength,
        bytes32[] memory proposalIdsCopy
    ) private {
        if (proposalIndex != proposalIdsLength - 1) {
            for (
                uint256 i = proposalIndex;
                i < proposalIdsLength - 1;
                i = uncheckedInc(i)
            ) {
                proposalIds[i] = proposalIdsCopy[i + 1];
            }
        }
        proposalIds.pop();
    }

    // --- private pure functions ---

    /// @notice Unchecked increment to save gas. Should be used primarily on
    ///			`for` loops, since the value of `i` will be smaller than the
    ///         a target length, which is bound to be smaller than 2**256 - 1.
    /// @param i The value to be incremented.
    /// @return The incremeneted value.
    function uncheckedInc(uint256 i) private pure returns (uint256) {
        unchecked {
            return ++i;
        }
    }
}
