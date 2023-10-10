// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

interface IKeeperRegistry{
    function withdrawFunds(uint256 id, address to) external;
    function getMinBalanceForUpkeep(uint256 id) external view returns (uint96 minBalance);
}