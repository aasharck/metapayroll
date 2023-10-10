// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;

import "forge-std/Test.sol";
import "openzeppelin-contracts/token/ERC20/IERC20.sol";
import { BscVault } from "src/BscVault.sol";
import { BscMaster } from "src/BscMaster.sol";
import {AutomationRegistryInterface} from "chainlink/src/v0.8/interfaces/AutomationRegistryInterface1_2.sol";

contract VaultTest is Test {
    BscMaster public master;
    AutomationRegistryInterface public registryInterface;
    address public owner = 0xf9B888aA7CDBD123FA59571a19449C85017ca833;
    address public WHALE = 0x0000000000000000000000000000000000001004;
    address public LINKWHALE = 0x969a9A0bbE30aF7eA03Dcdc5cA7E781061f6e0A2;
    address public address1 = 0xa0Ee7A142d267C1f36714E4a8F75612F20a79720;
    address public address2 = 0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f;
    address public address3 = 0x14dC79964da2C08b23698B3D3cc7Ca32193d9955;
    address public address4 = 0x976EA74026E726554dB657fA54763abd0C3a0aa9;
    address public USDC = 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d;
    address public BUSD = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address public LINK = 0x404460C6A5EdE2D891e8297795264fDe62ADBB75;
    address public registry = 0x02777053d6764996e594c3E88AF1D58D5363a2e6;
    uint256 public monthlyTimestamp = 2629743;  

    function setUp() public {
        vm.prank(owner);
        master = new BscMaster();
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
        if(tokenAddress == LINK){
            vm.prank(LINKWHALE);
            IERC20(tokenAddress).transfer(to, amount);
        }else{
            vm.prank(WHALE);
            IERC20(tokenAddress).transfer(to, amount);
        }
        
    }

    function initializeVault(address executor) public returns(BscVault){
        address vaultAddress = createVault(executor);
        fundAddress(vaultAddress, LINK, 18);
        fundAddress(vaultAddress, USDC, 6);
        fundAddress(vaultAddress, BUSD, 18);
        vm.startPrank(executor);
        BscVault thisVault = BscVault(vaultAddress);
        thisVault.registerAndPredictID("vault", executor, 50000000000000000000);
        vm.stopPrank();
        return thisVault;
    }

    function testCreatingVault() public {
        fundAddress(address1, BUSD, 18);
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
        BscVault(vaultAddress).registerAndPredictID("vault", address1, 50000000000000000000);
        uint256 upkeepID = BscVault(vaultAddress).upkeepId();
        vm.stopPrank();
        (,,, uint96 balance,,,,) = registryInterface.getUpkeep(upkeepID);
        assertEq(balance, 50000000000000000000);
    }

    
    function testAddingEmployees() public{
        BscVault thisVault = initializeVault(address1);
        vm.startPrank(address1);
        thisVault.addEmployees(address2, 20*10**18, BUSD, block.timestamp + 500, 300);
        (uint256 salary,address token,uint256 nextPayTimestamp,uint256 timePeriod,) = thisVault.employeeDetails(address2);
        assertEq(salary, 20*10**18);
        assertEq(token, BUSD);
        assertEq(nextPayTimestamp, block.timestamp + 500);
        assertEq(timePeriod, 300);
        vm.stopPrank();
    }

    // Upkeeps won't work on forked networks
    function testSendingSalary() public{
        BscVault thisVault = initializeVault(address1);
        vm.prank(address1);
        thisVault.addEmployees(address2, 20*10**18, BUSD, block.timestamp + 500, 300);
        uint256 beforeBalance = IERC20(BUSD).balanceOf(address2);
        vm.warp(block.timestamp+501);

        thisVault.performUpkeep(abi.encode(address2));
        uint256 afterBalance = IERC20(BUSD).balanceOf(address2);
        assertGt(afterBalance, beforeBalance);
    }


    function testEditEmployees() public{
        BscVault thisVault = initializeVault(address1);
        vm.startPrank(address1);
        thisVault.addEmployees(address2, 20*10**18, BUSD, block.timestamp + 500, 300);
        thisVault.editEmployees(address2, 40*10**18, BUSD, block.timestamp + 1000, 100);
        (uint256 salary,address token,uint256 nextPayTimestamp,uint256 timePeriod,) = thisVault.employeeDetails(address2);
        assertEq(salary, 40*10**18);
        assertEq(token, BUSD);
        assertEq(nextPayTimestamp, block.timestamp + 1000);
        assertEq(timePeriod, 100);
    }

    function testOnlyAuthorizedCallsPossible() public{
        BscVault thisVault = initializeVault(address1);
        vm.startPrank(address2);
        vm.expectRevert("Ownable: caller is not the owner");
        thisVault.addEmployees(address3, 20*10**18, BUSD, block.timestamp + 500, 300);

        vm.expectRevert("Ownable: caller is not the owner");
        thisVault.withdrawToken(BUSD, 100000);

        vm.expectRevert("Ownable: caller is not the owner");
        thisVault.editEmployees(address3, 40*10**18, BUSD, block.timestamp + 1000, 100);

        vm.expectRevert("Ownable: caller is not the owner");
        thisVault.removeEmployees(address3);
        vm.stopPrank();
    }

    function testIfDoublePeformUpkeepCannotbeDone() public{
        BscVault thisVault = initializeVault(address1);
        vm.prank(address1);
        thisVault.addEmployees(address2, 20*10**18, BUSD, block.timestamp + 500, 300);
        uint256 beforeBalance = IERC20(BUSD).balanceOf(address2);
        vm.warp(block.timestamp+501);
        thisVault.performUpkeep(abi.encode(address2));
        vm.warp(block.timestamp+2);
        thisVault.performUpkeep(abi.encode(address2));
        vm.warp(block.timestamp+20);
        thisVault.performUpkeep(abi.encode(address2));
        uint256 afterBalance = IERC20(BUSD).balanceOf(address2);
        assertEq(afterBalance, beforeBalance + 20*10**18);
    }

    function testIfDuplicateEmployeeCannotBeAddedAgain() public{
        BscVault thisVault = initializeVault(address1);
        vm.startPrank(address1);
        thisVault.addEmployees(address2, 20*10**18, BUSD, block.timestamp + 500, 300);
        vm.expectRevert("This employee is already registered");
        thisVault.addEmployees(address2, 30*10**18, BUSD, block.timestamp + 590, 300);
        vm.stopPrank();
    }

    function testAddingDeletedEmployee() public{
        BscVault thisVault = initializeVault(address1);
        vm.startPrank(address1);
        thisVault.addEmployees(address2, 20*10**18, BUSD, block.timestamp + 500, 300);
        (uint256 salary,address token,uint256 nextPayTimestamp,uint256 timePeriod, bool deleted) = thisVault.employeeDetails(address2);
        assertEq(salary, 20*10**18);
        assertEq(token, BUSD);
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