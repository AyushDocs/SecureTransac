// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ITrustRegistry {
    function getScore(address user) external view returns (uint256);
}

contract SoulBoundToken is ERC721, Ownable {
    ITrustRegistry public registry;
    
    mapping(address => bool) private _hasMinted;

    event ReputationCardMinted(address indexed user, uint256 initialScore);

    constructor(address _registry) ERC721("SecureTransac Reputation Card", "STRC") Ownable(msg.sender) {
        registry = ITrustRegistry(_registry);
    }

    function mint() external {
        require(!_hasMinted[msg.sender], "SBT already minted");
        
        uint256 score = registry.getScore(msg.sender);
        _hasMinted[msg.sender] = true;
        _safeMint(msg.sender, uint256(uint160(msg.sender)));
        
        emit ReputationCardMinted(msg.sender, score);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("SBT: Transfer not allowed");
        }
        return super._update(to, tokenId, auth);
    }

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
        return string(abi.encodePacked("SecureTransac-SBT-Level:", level));
    }
}
