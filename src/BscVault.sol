// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.6;

import "openzeppelin-contracts/access/Ownable.sol";
import "openzeppelin-contracts/token/ERC20/IERC20.sol";
import "chainlink/src/v0.8/AutomationCompatible.sol";
import {AutomationRegistryInterface, State, Config} from "chainlink/src/v0.8/interfaces/AutomationRegistryInterface1_2.sol";
import {LinkTokenInterface} from "chainlink/src/v0.8/interfaces/LinkTokenInterface.sol";

// For security, contact aasharck@gmail.com
interface KeeperRegistrarInterface {
    function register(
        string memory name,
        bytes calldata encryptedEmail,
        address upkeepContract,
        uint32 gasLimit,
        address adminAddress,
        bytes calldata checkData,
        uint96 amount,
        uint8 source,
        address sender
    ) external;
}

contract BscVault is AutomationCompatibleInterface, Ownable {
    address[] public employees;
    uint256 public totalEmployees;
    uint256 public upkeepId;
    LinkTokenInterface public immutable ILink;
    // TODO: Change for BSC
    address public registrar = 0xDb8e8e2ccb5C033938736aa89Fe4fa1eDfD15a1d; // testnet - 0xDb8e8e2ccb5C033938736aa89Fe4fa1eDfD15a1d
    address public registry = 0x02777053d6764996e594c3E88AF1D58D5363a2e6; // testnet - 0x02777053d6764996e594c3E88AF1D58D5363a2e6
    AutomationRegistryInterface public immutable IRegistry;
    bytes4 registerSig = KeeperRegistrarInterface.register.selector;

    struct Employee {
        uint256 salary;
        address token;
        uint256 nextPayTimestamp;
        uint256 timePeriod;
        bool deleted;
    }
    mapping(address => Employee) public employeeDetails;

    event SalarySent(address indexed, uint256);
    event EmployeeAdded(address indexed, uint256);
    event EmployeeEdited(address indexed);
    event EmployeeDeleted(address indexed);

    constructor(address _owner) {
        // TODO: Change below address for BSC
        ILink = LinkTokenInterface(0x404460C6A5EdE2D891e8297795264fDe62ADBB75); // testnet -  0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06
        IRegistry = AutomationRegistryInterface(registry);
        transferOwnership(_owner);
    }

     function registerAndPredictID(
        string memory name,
        address adminAddress,
        uint96 amount
    ) external onlyOwner{
        require(upkeepId == 0, "Upkeep already created");
        (State memory state, Config memory _c, address[] memory _k) = IRegistry.getState();
        uint256 oldNonce = state.nonce;

        bytes memory payload = abi.encode(
            name,
            "",
            address(this),
            500000,
            adminAddress,
            "",
            amount,
            0,
            address(this)
        );

        ILink.transferAndCall(
            registrar,
            amount,
            bytes.concat(registerSig, payload)
        );

        (state, _c, _k) = IRegistry.getState();
        uint256 newNonce = state.nonce;
        if (newNonce == oldNonce + 1) {
            uint256 upkeepID = uint256(
                keccak256(
                    abi.encodePacked(
                        blockhash(block.number - 1),
                        address(IRegistry),
                        uint32(oldNonce)
                    )
                )
            );
            upkeepId = upkeepID;
        } else {
            revert("auto-approve disabled");
        }
    }

    function addEmployees(
        address _employeeAddress,
        uint256 _employeeSalary,
        address _token,
        uint256 _firstPayTimestamp,
        uint256 _timePeriod
    ) external onlyOwner {
        require(employeeDetails[_employeeAddress].token == address(0) || employeeDetails[_employeeAddress].deleted == true, "This employee is already registered");
        employeeDetails[_employeeAddress].salary = _employeeSalary;
        employeeDetails[_employeeAddress].token = _token;
        employeeDetails[_employeeAddress].nextPayTimestamp = _firstPayTimestamp;
        employeeDetails[_employeeAddress].timePeriod = _timePeriod;
        employeeDetails[_employeeAddress].deleted = false;
        totalEmployees++;
        employees.push(_employeeAddress);
        emit EmployeeAdded(_employeeAddress, _employeeSalary);
    }

    function editEmployees(
        address _employeeAddress,
        uint256 _employeeSalary,
        address _token,
        uint256 _nextPayTimestamp,
        uint256 _timePeriod
    ) external onlyOwner {
        employeeDetails[_employeeAddress].salary = _employeeSalary;
        employeeDetails[_employeeAddress].token = _token;
        employeeDetails[_employeeAddress].nextPayTimestamp = _nextPayTimestamp;
        employeeDetails[_employeeAddress].timePeriod = _timePeriod;
        emit EmployeeEdited(_employeeAddress);
    }

    function removeEmployees(address _employeeAddress) external onlyOwner {
        employeeDetails[_employeeAddress].deleted = true;
        emit EmployeeDeleted(_employeeAddress);
    }

    function withdrawToken(address _tokenAddress, uint256 _amount)
        external
        onlyOwner
    {
        IERC20(_tokenAddress).transfer(msg.sender, _amount);
    }

    function checkUpkeep(bytes calldata)
        external
        view
        override
        returns (bool upkeepNeeded, bytes memory performData)
    {
        for (uint256 i = 0; i < totalEmployees; i++) {
            bool isPaymentTime = block.timestamp >= employeeDetails[employees[i]].nextPayTimestamp;
            bool isDeleted = employeeDetails[employees[i]].deleted == false;
            upkeepNeeded = isPaymentTime && isDeleted;
            if(upkeepNeeded){
                performData = abi.encode(employees[i]);
                return(upkeepNeeded, performData);
            }
        }
    }

    function performUpkeep(bytes calldata performData) external override {
        address employeeAddress = abi.decode(performData, (address));
        bool isPaymentTime = block.timestamp >= employeeDetails[employeeAddress].nextPayTimestamp;
        bool isDeleted = employeeDetails[employeeAddress].deleted == false;
        if (isPaymentTime && isDeleted) {
            employeeDetails[employeeAddress].nextPayTimestamp += employeeDetails[employeeAddress].timePeriod;
            uint256 amount = employeeDetails[employeeAddress].salary;
            IERC20(employeeDetails[employeeAddress].token).transfer(
                employeeAddress,
                amount
            );
            emit SalarySent(employeeAddress, amount);
        }
    }

    function checkIfLinkIsWithdrawable() external view returns(bool){
        (,,,,,,uint64 maxValidBlocknumber,) = IRegistry.getUpkeep(upkeepId);
        if (maxValidBlocknumber > block.number){
            return false;
        }else{
            return true;
        }
    }
    
}