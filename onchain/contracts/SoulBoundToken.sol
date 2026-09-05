// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ITrustRegistry.sol";

contract SoulBoundToken is ERC721, Ownable {
    ITrustRegistry public registry;

    mapping(address => bool) private _hasMinted;
    mapping(uint256 => string) private _tokenURIs;

    event ReputationCardMinted(address indexed user, uint256 indexed tokenId, string cardURI);

    constructor(address _registry) ERC721("SecureTransac Reputation Card", "STRC") Ownable(msg.sender) {
        registry = ITrustRegistry(_registry);
    }

    function mint() external {
        require(!_hasMinted[msg.sender], "SBT already minted");

        uint256 tokenId = uint256(uint160(msg.sender));
        _hasMinted[msg.sender] = true;
        _safeMint(msg.sender, tokenId);

        emit ReputationCardMinted(msg.sender, tokenId, "");
    }

    function mintFor(address user, string calldata cardUri) external onlyOwner {
        require(!_hasMinted[user], "SBT already minted");
        require(user != address(0), "Zero address");

        uint256 tokenId = uint256(uint160(user));
        _hasMinted[user] = true;
        _safeMint(user, tokenId);

        if (bytes(cardUri).length > 0) {
            _tokenURIs[tokenId] = cardUri;
        }

        emit ReputationCardMinted(user, tokenId, cardUri);
    }

    function setTokenURI(uint256 tokenId, string calldata uri) external onlyOwner {
        _requireOwned(tokenId);
        _tokenURIs[tokenId] = uri;
    }

    function cardURI(address user) external view returns (string memory) {
        uint256 tokenId = uint256(uint160(user));
        return _tokenURIs[tokenId];
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0) && to != address(0)) {
            revert("SBT: Transfer not allowed");
        }
        return super._update(to, tokenId, auth);
    }

    function getReputationLevel(address user) public view returns (string memory) {
        uint256 score = registry.provenMaxScoreTillNow(user);
        if (score >= 90) return "DIAMOND";
        if (score >= 80) return "PLATINUM";
        if (score >= 60) return "GOLD";
        if (score >= 40) return "SILVER";
        return "BRONZE";
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        string memory stored = _tokenURIs[tokenId];
        if (bytes(stored).length > 0) {
            return stored;
        }
        address ownerAddr = address(uint160(tokenId));
        string memory level = getReputationLevel(ownerAddr);
        return string(abi.encodePacked("SecureTransac-SBT-Level:", level));
    }
}
