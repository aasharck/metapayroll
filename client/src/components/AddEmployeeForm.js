import React, { useState } from 'react'
import checkmark from './../checkmark.png'
import axios from 'axios';
import { ethers } from 'ethers';
import { useNetwork } from 'wagmi'


const AddEmployeeForm = ({vaultContract, USDC, BUSD, moralisChain, addingEmployee, setAddingEmployee}) => {
    const [employeeAddress, setEmployeeAddress] = useState();
    const [employeeToken, setEmployeeToken] = useState();
    const [employeeSalary, setEmployeeSalary] = useState();
    const [firstPayment, setFirstPayment] = useState();
    const [paymentInterval, setPaymentInterval] = useState();
    const { chain } = useNetwork()

    const monthlyTimestamp = 2629743;
    const biWeeklyTimestamp = 1209600;
    const weeklyTimestamp = 200 //604800;

    const addEmployees = async (e) => {
        try {
          setAddingEmployee(true)
          e.preventDefault();
          const options = {
            method: 'GET',
            url: 'https://deep-index.moralis.io/api/v2/erc20/metadata',
            params: { chain: moralisChain, addresses: employeeToken },
            headers: {
              accept: 'application/json',
              'X-API-Key': process.env.REACT_APP_MORALIS_API,
            },
          };
    
          const res = await axios.request(options);
          const decimals = res.data[0].decimals;
          const finalSalary = ethers.utils.parseUnits(employeeSalary, decimals);
          const tx = await vaultContract.addEmployees(
            employeeAddress,
            finalSalary,
            employeeToken,
            firstPayment,
            paymentInterval
          );
          await tx.wait();
          setAddingEmployee(false)
        } catch (error) {
          setAddingEmployee(false)
          console.log(error);
        }
      };

      const firstPaymentConvert = async (dateTime) => {
        try {
          const date = new Date(dateTime);
          const seconds = Math.floor(date.getTime() / 1000);
          setFirstPayment(seconds);
        } catch (error) {
          console.log(error);
        }
      };
    
    
  return (
    <div>
        <form className='row g-3 mt-3' onSubmit={(e) => addEmployees(e)}>
          <div className='col-md-3'>
            <label htmlFor='inputEmail4' className='form-label'>
              Employee Address
            </label>
            <input
              type='text'
              className='form-control'
              id='inputEmail4'
              onChange={(e) => setEmployeeAddress(e.target.value)}
              required={true}
            />
          </div>
          <div className='col-md-3'>
            <label htmlFor='inputPassword4' className='form-label'>
              Employee Salary
            </label>
            <input
              type='number'
              className='form-control'
              id='inputPassword4'
              onChange={(e) => setEmployeeSalary(e.target.value)}
              required={true}
            />
          </div>
          <div className='col-md-2'>
            <label htmlFor='inputState' className='form-label'>
              First Payment Date
            </label>
            <input
              type='datetime-local'
              className='form-control'
              placeholder='Set First Payment Date'
              aria-describedby='basic-addon1'
              onChange={(e) => firstPaymentConvert(e.target.value)}
              required={true}
            />
          </div>
          <div className='col-md-2'>
            <label htmlFor='inputState' className='form-label'>
              Payment Interval
            </label>
            <select id="inputState" className="form-select" onChange={(e) => setPaymentInterval(e.target.value)} required={true}>
                <option defaultValue={true}>Choose...</option>
                <option value={monthlyTimestamp}>Monthly</option>
                <option value={biWeeklyTimestamp}>Bi-Weekly</option>
                <option value={weeklyTimestamp}>200 Seconds</option>
          </select>
          </div>
          <div className='col-md-2'>
            <label htmlFor='inputState' className='form-label'>
              Select Token
            </label>
            <select
              id='inputState'
              className='form-select'
              onChange={(e) => setEmployeeToken(e.target.value)}
              required={true}
            >
              <option defaultValue={true}>Choose...</option>
              {chain.id == 1 || chain.id == 5 && <option value={USDC}>
                USDC
              </option>}
              <option value={BUSD}>
                BUSD
              </option>
            </select>
          </div>
          <div className='d-grid gap-2'>
            <button
              type='submit'
              className='btn btn-primary'
            >
              <span>{addingEmployee ? <span><span
                className='spinner-border spinner-border-sm me-2'
                role='status'
                aria-hidden='true'
              ></span>
              Adding</span> :<span><img className='me-2 mb-1' src={checkmark} width="20px"/>Add Employee</span>}</span>
            </button>
          </div>
        </form>
      </div>
  )
}

export default AddEmployeeForm