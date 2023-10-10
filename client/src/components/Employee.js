import React, { useEffect, useState } from 'react'
import deleteImg from './../delete.png'
import editImg from './../edit.png'
import EditEmployeeForm from './EditEmployeeForm';

const Employee = ({id, employee, employeeAddresses, vaultContract, USDC, BUSD, moralisChain}) => {
    
    const [isEditing, setIsEditing] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const deleteEmployee = async (employeeAddress) =>{
        try {
            setDeleting(true)
            const tx = await vaultContract.removeEmployees(employeeAddress);
            await tx.wait();
            setDeleting(false)
        } catch (error) {
            setDeleting(false)
            console.log(error)
        }
    }

  return (
    <>
    <tr key={id}>
        {isEditing ? (<EditEmployeeForm vaultContract={vaultContract} employee={employee} employeeAddress={employeeAddresses[id]} id={id} isEditing={isEditing} setIsEditing={setIsEditing} USDC={USDC} BUSD={BUSD} moralisChain={moralisChain}/>) : (
        <>
            <th scope="row">{id+1}</th>
            <td>{employeeAddresses[id]}</td>
            <td>{employee.salary/(10**employee.decimals)}</td>
            <td>{employee.tokenName}</td>
            <td>{(new Date(employee.nextPayTimestamp.toString() * 1000).toLocaleDateString()).slice(0,16)}</td>
            <td>{employee.timePeriod.toString() == '200' ? '200 Seconds' : (employee.timePeriod.toString() == '1209600'  ? 'Bi-Weekly' : 'Monthly')}</td>
            <td><button className='btn btn-warning float-end' onClick={() => setIsEditing(!isEditing)}><span><img className='mb-1' src={editImg} width="17px"/></span></button></td>
            <td><button className='btn btn-danger' onClick={() => deleteEmployee(employeeAddresses[id])}>{deleting ? <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
  <span className="visually-hidden">Loading...</span></> : <span><img className='mb-1' src={deleteImg} width="17px"/></span>}</button></td>
        </>)}
    </tr>
    </>
  )
}

export default Employee