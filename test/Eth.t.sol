// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import "openzeppelin-contracts/token/ERC20/IERC20.sol";
import { EthVault } from "src/EthVault.sol";
import { EthMaster } from "src/EthMaster.sol";
import {AutomationRegistryInterface} from "chainlink/src/v0.8/interfaces/AutomationRegistryInterface1_2.sol";

contract VaultTest is Test {
    EthMaster public master;
    AutomationRegistryInterface public registryInterface;
    address public owner = 0xf9B888aA7CDBD123FA59571a19449C85017ca833;
    address public WHALE = 0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503;
    address public address1 = 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720;
    address public address2 = 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f;
    address public address3 = 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955;
    address public address4 = 0x976EA74026E726554dB657fA54763abd0C3a0aa9;
    address public USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address public BUSD = 0x4Fabb145d64652a948d72533023f6E7A623C7C53;
    address public LINK = 0x514910771AF9Ca656af840dff83E8264EcF986CA;
    address public registry = 0x02777053d6764996e594c3E88AF1D58D5363a2e6;
    uint256 public monthlyTimestamp = 2629743;  

    function setUp() public {
        vm.prank(owner);
        master = new EthMaster();
        registryInterface = AutomationRegistryInterface(registry);
    }

    // HELPER FUNCTIONS

    function createVault(address executor) public returns (address newVaultAddress){
        vm.startPrank(executor);
        // creating vault
        newVaultAddress = master.createVault();
        vm.stopPrank();

    }

    function fundAddress(address to, address tokenAddress, uint256 decimals) public{
        uint256 amount = 1000 * 10**decimals;
        vm.prank(WHALE);
        IERC20(tokenAddress).transfer(to, amount);
    }

    function initializeVault(address executor) public returns(EthVault){
        address vaultAddress = createVault(executor);
        fundAddress(vaultAddress, LINK, 18);
        fundAddress(vaultAddress, USDC, 6);
        fundAddress(vaultAddress, BUSD, 18);
        vm.startPrank(executor);
        EthVault thisVault = EthVault(vaultAddress);
        thisVault.registerAndPredictID("vault", executor, 5 ether);
        vm.stopPrank();
        return thisVault;
    }

    function testCreatingVault() public {
        fundAddress(address1, USDC, 6);
        vm.startPrank(address1);
        address newVaultAddress = master.createVault();
        vm.stopPrank();
        address vaultAddress = master.allVaults(address1);
        assertEq(vaultAddress, newVaultAddress);
    }

    function testCreatingUpkeep() public{
        address vaultAddress = createVault(address1);
        fundAddress(vaultAddress, LINK, 18);
        vm.startPrank(address1);
        EthVault(vaultAddress).registerAndPredictID("vault", address1, 5 ether);
        uint256 upkeepID = EthVault(vaultAddress).upkeepId();
        vm.stopPrank();
        (,,, uint96 balance,,,,) = registryInterface.getUpkeep(upkeepID);
        assertEq(balance, 5 ether);
    }

    function testAddingEmployees() public{
        EthVault thisVault = initializeVault(address1);
        vm.startPrank(address1);
        thisVault.addEmployees(address2, 20*10**6, USDC, block.timestamp + 500, 300);
        (uint256 salary,address token,uint256 nextPayTimestamp,uint256 timePeriod,) = thisVault.employeeDetails(address2);
        assertEq(salary, 20*10**6);
        assertEq(token, USDC);
        assertEq(nextPayTimestamp, block.timestamp + 500);
        assertEq(timePeriod, 300);
        vm.stopPrank();
    }

    // Upkeeps won't work on forked networks
    function testSendingSalary() public{
        EthVault thisVault = initializeVault(address1);
        vm.prank(address1);
        thisVault.addEmployees(address2, 20*10**6, USDC, block.timestamp + 500, 300);
        uint256 beforeBalance = IERC20(USDC).balanceOf(address2);
        vm.warp(block.timestamp+501);

        thisVault.performUpkeep(abi.encode(address2));
        uint256 afterBalance = IERC20(USDC).balanceOf(address2);
        assertGt(afterBalance, beforeBalance);
    }

    function testEditEmployees() public{
        EthVault thisVault = initializeVault(address1);
        vm.startPrank(address1);
        thisVault.addEmployees(address2, 20*10**6, USDC, block.timestamp + 500, 300);
        thisVault.editEmployees(address2, 40*10**6, BUSD, block.timestamp + 1000, 100);
        (uint256 salary,address token,uint256 nextPayTimestamp,uint256 timePeriod,) = thisVault.employeeDetails(address2);
        assertEq(salary, 40*10**6);
        assertEq(token, BUSD);
        assertEq(nextPayTimestamp, block.timestamp + 1000);
        assertEq(timePeriod, 100);
    }

    function testOnlyAuthorizedCallsPossible() public{
        EthVault thisVault = initializeVault(address1);
        vm.startPrank(address2);
        vm.expectRevert("Ownable: caller is not the owner");
        thisVault.addEmployees(address3, 20*10**6, USDC, block.timestamp + 500, 300);

        vm.expectRevert("Ownable: caller is not the owner");
        thisVault.withdrawToken(USDC, 100000);

        vm.expectRevert("Ownable: caller is not the owner");
        thisVault.editEmployees(address3, 40*10**6, BUSD, block.timestamp + 1000, 100);

        vm.expectRevert("Ownable: caller is not the owner");
        thisVault.removeEmployees(address3);
        vm.stopPrank();
    }

    function testIfDoublePeformUpkeepCannotbeDone() public{
        EthVault thisVault = initializeVault(address1);
        vm.prank(address1);
        thisVault.addEmployees(address2, 20*10**6, USDC, block.timestamp + 500, 300);
        uint256 beforeBalance = IERC20(USDC).balanceOf(address2);
        vm.warp(block.timestamp+501);
        thisVault.performUpkeep(abi.encode(address2));
        vm.warp(block.timestamp+2);
        thisVault.performUpkeep(abi.encode(address2));
        vm.warp(block.timestamp+20);
        thisVault.performUpkeep(abi.encode(address2));
        uint256 afterBalance = IERC20(USDC).balanceOf(address2);
        assertEq(afterBalance, beforeBalance + 20000000);
    }

    function testIfDuplicateEmployeeCannotBeAddedAgain() public{
        EthVault thisVault = initializeVault(address1);
        vm.startPrank(address1);
        thisVault.addEmployees(address2, 20*10**6, USDC, block.timestamp + 500, 300);
        vm.expectRevert("This employee is already registered");
        thisVault.addEmployees(address2, 30*10**6, USDC, block.timestamp + 590, 300);
        vm.stopPrank();
    }

    function testAddingDeletedEmployee() public{
        EthVault thisVault = initializeVault(address1);
        vm.startPrank(address1);
        thisVault.addEmployees(address2, 20*10**6, USDC, block.timestamp + 500, 300);
        (uint256 salary,address token,uint256 nextPayTimestamp,uint256 timePeriod, bool deleted) = thisVault.employeeDetails(address2);
        assertEq(salary, 20*10**6);
        assertEq(token, USDC);
        assertEq(nextPayTimestamp, block.timestamp + 500);
        assertEq(timePeriod, 300);
        assertEq(deleted, false);
        thisVault.removeEmployees(address2);
        (, , , ,deleted) = thisVault.employeeDetails(address2);
        assertEq(deleted, true);
        thisVault.addEmployees(address2, 30*10**18, BUSD, block.timestamp + 1000, 1000);
        (salary, token, nextPayTimestamp, timePeriod, deleted) = thisVault.employeeDetails(address2);
        assertEq(salary, 30*10**18);
        assertEq(token, BUSD);
        assertEq(nextPayTimestamp, block.timestamp + 1000);
        assertEq(timePeriod, 1000);
        assertEq(deleted, false);
        vm.stopPrank();
    }
    
}