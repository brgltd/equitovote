// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

contract Diamond {
    struct FacetAddressAndPosition {
        address facetAddress;
        // Position in facetFunctionSelectors.functionSelectors array
        uint96 functionSelectorPosition;
    }

    struct FacetFunctionSelectors {
        bytes4[] functionSelectors;
        // Position of facetAddress in facetAddresses array
        uint256 facetAddressPosition;
    }

    struct DiamondStorage {
        mapping(bytes4 => FacetAddressAndPosition) selectorToFacetAndPosition;
        mapping(address => FacetFunctionSelectors) facetFunctionSelectors;
        address[] facetAddresses;
    }

    bytes32 constant DIAMOND_STORAGE_POSITION = keccak256("diamond.standard.diamond.storage");

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 position = DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    // Fallback function to delegate calls to the correct facet
    fallback() external payable {
        DiamondStorage storage ds = diamondStorage();
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Function does not exist");

        // Delegate the function call to the correct facet
        (bool success, bytes memory data) = facet.delegatecall(msg.data);
        require(success, "Delegatecall failed");
        assembly {
            return(add(data, 32), mload(data))
        }
    }
}
