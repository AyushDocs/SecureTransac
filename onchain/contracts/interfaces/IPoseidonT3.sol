// SPDX-License-Identifier: LGPL-3.0+
pragma solidity ^0.8.0;

interface IPoseidonT3 {
    function poseidon(uint256[2] memory input) external pure returns (uint256);
}
