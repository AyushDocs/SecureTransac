// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IGuardian {
    function registry() external view returns (address);
    function minRequiredScore() external view returns (uint256);
}
