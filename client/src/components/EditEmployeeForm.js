import React, { useState } from 'react';
import submitImg from './../submit.png';
import cancelImg from './../cancel.png';
import { ethers } from 'ethers';
import axios from 'axios';
import { useNetwork } from 'wagmi'

const EditEmployeeForm = ({
  vaultContract,
  employee,
  employeeAddress,
  id,
  isEditing,
  setIsEditing,
  USDC, 
  BUSD,
  moralisChain
}) => {
  const [employeeSalaryEdit, setEmployeeSalaryEdit] = useState();
  const [employeeTokenEdit, setEmployeeTokenEdit] = useState();
  const [firstPaymentEdit, setFirstPaymentEdit] = useState();
  const [paymentIntervalEdit, setPaymentIntervalEdit] = useState();
  const [editing, setEditing] = useState(false);
  const { chain } = useNetwork()
  const monthlyTimestamp = 2629743;
  const biWeeklyTimestamp = 1209600;
  const weeklyTimestamp = 200; // 604800;

  

  const editEmployee = async (empAddress) => {
    try {
      setEditing(true)
      const options = {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/erc20/metadata',
        params: { chain: moralisChain, addresses: `${employeeTokenEdit}` },
        headers: {
          accept: 'application/json',
          'X-API-Key': process.env.REACT_APP_MORALIS_API,
        },
      };

      const res = await axios.request(options);
      const decimals = res.data[0].decimals;
      const finalSalary = ethers.utils.parseUnits(
        employeeSalaryEdit.toString(),
        decimals
      );
      const date = new Date(firstPaymentEdit);
      const seconds = Math.floor(date.getTime() / 1000);
      const tx = await vaultContract.editEmployees(
        empAddress,
        finalSalary,
        employeeTokenEdit,
        seconds,
        paymentIntervalEdit
      );
      await tx.wait();
      setEditing(false)
      setIsEditing(false);
    } catch (error) {
      setEditing(false)
      console.log(error);
    }
  };

  // const demo = () => {
  //   console.log(((new Date(employee.nextPayTimestamp.toString() * 1000))))
  // console.log((new Date(employee.nextPayTimestamp.toString() * 1000).getTimezoneOffset())/60)
  //   console.log((new Date(employee.nextPayTimestamp.toString() * 1000).toISOString()))
  //   // 2023-01-04T10:18
  // }

  //   2022-12-30T14:42
  return (
    <>
      <th scope='row'>{id + 1}</th>
      <td>
        <input
          type='text'
          className='form-control'
          disabled={true}
          value={employeeAddress}
        />
      </td>
      <td>
        <input
          type='number'
          className='form-control col-1'
          onChange={(e) => setEmployeeSalaryEdit(e.target.value)}
          value={
            employeeSalaryEdit == undefined
              ? setEmployeeSalaryEdit(employee.salary / 10 ** employee.decimals)
              : employeeSalaryEdit
          }
          //   defaultValue={employee.salary/(10**employee.decimals)}
        />
      </td>
      <td>
        <select
          id='inputState'
          className='form-select'
          //   defaultValue={employee.token}
          value={
            employeeTokenEdit == undefined
              ? setEmployeeTokenEdit(employee.token)
              : employeeTokenEdit
          }
          onChange={(e) => setEmployeeTokenEdit(e.target.value)}
        >
          {chain.id == 1 ||
            (chain.id == 5 && <option value={USDC}>USDC</option>)}
          <option value={BUSD}>BUSD</option>
        </select>
      </td>
      <td>
        <input
          type='datetime-local'
          className='form-control'
          aria-describedby='basic-addon1'
          value={
            firstPaymentEdit == undefined
              ? setFirstPaymentEdit(
                  new Date(employee.nextPayTimestamp.toString() * 1000)
                    .toISOString()
                    .slice(0, 16)
                )
              : firstPaymentEdit
          }
          onChange={(e) => setFirstPaymentEdit(e.target.value)}
        />
      </td>
      <td>
        <select
          id='inputState'
          className='form-select'
          value={
            paymentIntervalEdit == undefined
              ? setPaymentIntervalEdit(
                  employee.timePeriod.toString() == weeklyTimestamp
                    ? weeklyTimestamp
                    : employee.timePeriod.toString() == biWeeklyTimestamp
                    ? 'Bi-Weekly'
                    : monthlyTimestamp
                )
              : paymentIntervalEdit
          }
          onChange={(e) => setPaymentIntervalEdit(e.target.value)}
        >
          <option value={monthlyTimestamp}>Monthly</option>
          <option value={biWeeklyTimestamp}>Bi-Weekly</option>
          <option value={weeklyTimestamp}>200 Seconds</option>
        </select>
      </td>
      <td>
        <button
          className='btn btn-outline-dark float-end'
          onClick={() => setIsEditing(!isEditing)}
        >
          <span>
            <img className='mb-1' src={cancelImg} width='17px' />
          </span>
        </button>
      </td>
      <td>
        <button
          className='btn btn-primary'
          onClick={() => editEmployee(employeeAddress)}
        >
          {editing ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
  <span className="visually-hidden">Loading...</span></> : <span>
            <img className='mb-1' src={submitImg} width='17px' />
          </span>}
        </button>
      </td>
      {/* <button onClick={demo}>DEMO</button> */}
    </>
  );
};

export default EditEmployeeForm;
