// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITrustRegistry {
    function getScore(address user) external view returns (uint256);
}

/**
 * @title SecureTransacSBT
 * @dev Soulbound Token representing a user's reputation.
 * Non-transferable and visually evolves based on TrustRegistry score.
 */
contract SecureTransacSBT is ERC721, Ownable {
    ITrustRegistry public registry;
    
    mapping(address => bool) private _hasMinted;

    event ReputationCardMinted(address indexed user, uint256 initialScore);

    constructor(address _registry) ERC721("SecureTransac Reputation Card", "STRC") Ownable(msg.sender) {
        registry = ITrustRegistry(_registry);
    }

    /**
     * @dev Mint a soulbound card. Can only be done once per address.
     */
    function mint() external {
        require(!_hasMinted[msg.sender], "SBT already minted");
        
        uint256 score = registry.getScore(msg.sender);
        _hasMinted[msg.sender] = true;
        _safeMint(msg.sender, uint256(uint160(msg.sender))); // ID is the address representation
        
        emit ReputationCardMinted(msg.sender, score);
    }

    /**
     * @dev Prevent transfers (Soulbound logic)
     */
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("SBT: Transfer not allowed");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Returns the level based on the trust score.
     */
    function getReputationLevel(address user) public view returns (string memory) {
        uint256 score = registry.getScore(user);
        if (score >= 90) return "DIAMOND";
        if (score >= 80) return "PLATINUM";
        if (score >= 60) return "GOLD";
        if (score >= 40) return "SILVER";
        return "BRONZE";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        address ownerAddr = address(uint160(tokenId));
        string memory level = getReputationLevel(ownerAddr);
        
        // In production, this would return a base64 encoded JSON or IPFS link
        // For the demo, we return a mock dynamic metadata string
        return string(abi.encodePacked("SecureTransac-SBT-Level:", level));
    }
}
