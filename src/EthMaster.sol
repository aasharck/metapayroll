// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;

import './EthVault.sol';

// For security, contact aasharck@gmail.com
contract EthMaster{
    mapping(address => address) public allVaults;

    event VaultCreated(address owner, address vaultAddress);

    function createVault() external returns(address){
        require(allVaults[msg.sender] == address(0), "You already have a vault created for this address");
        address newVault = address(new EthVault(msg.sender));
        allVaults[msg.sender] = newVault;
        emit VaultCreated(msg.sender, newVault);
        return newVault;
    }

}