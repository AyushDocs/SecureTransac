// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Guardian.sol";

/**
 * @title SecureDocumentStorage
 * @dev Stores encrypted user data (IPFS hashes) and manages access reveal for authorities.
 */
contract SecureDocumentStorage is Guardian {
    struct EncryptedData {
        string ipfsHash;
        uint256 timestamp;
        bool exists;
    }

    mapping(address => EncryptedData) private userToData;
    mapping(address => bool) public isAuthorizedAuthority;

    event DataStored(address indexed user, string ipfsHash);
    event DataRequested(address indexed user, address indexed authority);
    event AuthorityStatusChanged(address indexed authority, bool status);

    error NotAuthorizedAuthority(address authority);
    error DataNotFound(address user);

    constructor(address _registry) Guardian(_registry, 60) {
        // Owner/Registry owner can set authorities
    }

    function setAuthorityStatus(address authority, bool status) external {
        // Simple logic: Only registry owner can set authorities
        require(msg.sender == registry.owner(), "Only registry owner can set authorities");
        isAuthorizedAuthority[authority] = status;
        emit AuthorityStatusChanged(authority, status);
    }

    // Store user's own encrypted identity data - no trust score required for own data
    function storeData(string calldata _ipfsHash) external {
        userToData[msg.sender] = EncryptedData({
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            exists: true
        });
        emit DataStored(msg.sender, _ipfsHash);
    }

    function requestData(address _user) external view returns (string memory) {
        if (!isAuthorizedAuthority[msg.sender]) {
            revert NotAuthorizedAuthority(msg.sender);
        }
        if (!userToData[_user].exists) {
            revert DataNotFound(_user);
        }
        return userToData[_user].ipfsHash;
    }
}
