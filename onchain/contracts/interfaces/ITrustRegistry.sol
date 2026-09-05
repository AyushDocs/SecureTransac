// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ITrustRegistry {
    function getScore(address user) external view returns (bytes memory);
    function provenMaxScoreTillNow(address user) external view returns (uint256);
    function upgradeTier(uint8 tierIndex) external;
    function authorizeTier(address user, uint8 tierIndex) external;
    function isBlacklisted(address user) external view returns (bool);
}
