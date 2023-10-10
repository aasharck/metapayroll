import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import IERC20abi from '../contractsData/IERC20.json'
import AddEmployeeForm from './AddEmployeeForm';
import Employee from './Employee';
import { useNetwork } from 'wagmi'

const Dashboard = ({ address, signer, vaultContract, linkContract, registryContract, LINK, USDC, BUSD, moralisChain, keeperRegistryContract}) => {

  const [allEmployees, setAllEmployees] = useState([]);
  const [employeeAddresses, setEmployeeAddresses] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [addingEmployee, setAddingEmployee] = useState(false)
  const [addingFunds, setAddingFunds] = useState(false)

  const [withdrawingFunds, setWithdrawingFunds] = useState(false)
  const [withdrawFundsToken, setWithdrawFundsToken] = useState(null);
  const [amountToWithdraw, setAmountToWithdraw] = useState(0);

  const [linkBalance, setLinkBalance] = useState(0);
  const [tokenBalances, setTokenBalances] = useState([]);
  const [addFundsToken, setAddFundsToken] = useState(null);
  const [amountToFund, setAmountToFund] = useState(0);

  const [minBalanceUpkeep, setMinBalanceUpkeep] = useState();

  const { chain } = useNetwork()

  useEffect(()=>{
    getTokenBalances();
  },[])

  useEffect(() => {
    if(vaultContract != undefined){
      getLinkBalance();
    }
  },[addingFunds])

  useEffect(() => {
    if(vaultContract != undefined){
      getAllEmployees();
    }
  },[addingEmployee])

  if (vaultContract != undefined) {

    vaultContract.on("EmployeeEdited", ()=>{
      console.log("Refreshed")
      getAllEmployees();
    })

    vaultContract.on("EmployeeDeleted", ()=>{
      console.log("Refreshed")
      getAllEmployees();
    })
  }

  const getTokenBalances = async () =>{
    try {
      console.log("getTokenBalances")
      const options = {
        method: 'GET',
        url: `https://deep-index.moralis.io/api/v2/${vaultContract.address}/erc20`,
        params: { chain: moralisChain },
        headers: {
          accept: 'application/json',
          'X-API-Key': process.env.REACT_APP_MORALIS_API,
        },
      };

      const res = await axios.request(options);
      setTokenBalances(res.data)
    } catch (error) {
      console.log(error)
    }
  }

  
  const getLinkBalance = async () => {
    try {
      console.log("getLinkBalance")
      const upkeepId = await vaultContract.upkeepId();
      if(upkeepId == 0){
        setLinkBalance(0);
      }else{
        const tx = await registryContract.getUpkeep(upkeepId);
        const balanceLink = tx.balance/10**18;
        setLinkBalance(balanceLink);
        const tx2 = await keeperRegistryContract.getMinBalanceForUpkeep(upkeepId);
        const minBal = tx2/10**18;
        setMinBalanceUpkeep(minBal);
      }
    } catch (error) {
      console.log(error)
    }
  }

  const getAllEmployees = async () =>{
    try {
      console.log("getAllEmployees")
      setLoadingEmployees(true)
      let employees = []
      let employeeAddresses = []
      const totalEmployees = await vaultContract.totalEmployees();
      if(totalEmployees != 0){
        for(let i=0; i<totalEmployees;i++){
          const tx = await vaultContract.employees(i);
          const employeeDetails = await vaultContract.employeeDetails(tx);

          if(employeeDetails.deleted == false){
          employeeAddresses.push(tx);
          const options = {
            method: 'GET',
            url: 'https://deep-index.moralis.io/api/v2/erc20/metadata',
            params: { chain: moralisChain, addresses: `${employeeDetails.token}` },
            headers: {
              accept: 'application/json',
              'X-API-Key': process.env.REACT_APP_MORALIS_API,
            },
          };
    
          const res = await axios.request(options);
          const decimals = res.data[0].decimals;
          const name = res.data[0].name;
          let obj = {
            decimals: decimals,
            tokenName: name
          }
          let bothTogether = {...employeeDetails,...obj};
          employees.push(bothTogether)
          }
        }
      }
      setEmployeeAddresses(employeeAddresses)
      setAllEmployees(employees)
      setLoadingEmployees(false)
    } catch (error) {
      setLoadingEmployees(false)
      console.log(error)
    }
  }


  const withdrawFunds = async () => {
    try {
      setWithdrawingFunds(true)
      if(withdrawFundsToken == null || amountToWithdraw == 0){
        alert("Please ensure that you have given all values")
      }else{
      const options = {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/erc20/metadata',
        params: { chain: moralisChain, addresses: `${withdrawFundsToken}` },
        headers: {
          accept: 'application/json',
          'X-API-Key': process.env.REACT_APP_MORALIS_API,
        },
      };

      const res = await axios.request(options);
      const decimals = res.data[0].decimals;
      const amtWithDecimals = ethers.utils.parseUnits(amountToWithdraw.toString(), decimals)
      const tx = await vaultContract.withdrawToken(withdrawFundsToken, amtWithDecimals);
      await tx.wait()
      setWithdrawingFunds(false)
      alert("Success")
    }
    } catch (error) {
      console.log(error.error)
      alert(error.error.message)
      setWithdrawingFunds(false)
    }
  }

  const addFunds = async () => {
    try {
      setAddingFunds(true)
      if(addFundsToken == null || amountToFund == 0){
        alert("Please ensure that you have given all values")
      }else{
      const ERC20Contract = new ethers.Contract(addFundsToken, IERC20abi.abi, signer);
      const options = {
        method: 'GET',
        url: 'https://deep-index.moralis.io/api/v2/erc20/metadata',
        params: { chain: moralisChain, addresses: `${addFundsToken}` },
        headers: {
          accept: 'application/json',
          'X-API-Key': process.env.REACT_APP_MORALIS_API,
        },
      };

      const res = await axios.request(options);
      const decimals = res.data[0].decimals;
      const amtWithDecimals = ethers.utils.parseUnits(amountToFund.toString(), decimals)

      if(addFundsToken == LINK){
        console.log("VAULTT", vaultContract)
        const upkeepId = await vaultContract.upkeepId();
        const linkAmtWithDecimals = ethers.utils.parseEther(amountToFund.toString())
        if(upkeepId == 0){
        const sendTx = await linkContract.transfer(vaultContract.address, linkAmtWithDecimals);
        await sendTx.wait();
        const tx = await vaultContract.registerAndPredictID("Vault", address, linkAmtWithDecimals);
        await tx.wait();
      }else{
        const approveTx = await linkContract.approve(registryContract.address, amtWithDecimals)
        await approveTx.wait();
        const tx = await registryContract.addFunds(upkeepId, amtWithDecimals);
        await tx.wait()
      }
      }else{
      const tx = await ERC20Contract.transfer(vaultContract.address, amtWithDecimals);
      await tx.wait();
      }
      alert("Funded! Balance will be show on the dashboard in a few seconds!")
    }
      setAddingFunds(false)
    } catch (error) {
      setAddingFunds(false)
      console.log(error)
      alert(error.error.data.message)
    }
  }

  return (
    <div className='mb-5'>
      <h1 className='text-center'>Dashboard</h1>
      {linkBalance == 0 && <div className="alert alert-danger mt-3" role="alert">
        You need LINK for the automation to work. Please fund atleast 15 LINK by clicking the Add Funds button below
      </div>}
      {moralisChain == 'goerli' && <div className="alert alert-info mt-3" role="alert">
        You can get Testnet LINK from - <a href="https://faucets.chain.link/goerli">here</a>. and also get Test USDC from <a href="https://goerli.etherscan.io/address/0x1Bf831e1462335A3874c6849Db254B85F90554fD#writeContract">here</a> by clicking getUSDC function
      </div>}
      {linkBalance <= minBalanceUpkeep+3 && <div className="alert alert-warning mt-3" role="alert">
        Minimum balance required to run the app is <b>{minBalanceUpkeep} LINK!</b> Please fund some LINK for the smooth working of the App
      </div>}
      <div className='row'>
        <div className={`mt-2 col-lg-3 p-4 rounded infoBox`}><h4 className='lead text-center'><b className='text-secondary fs-6'>LINK</b><br/><div className='mt-2'>{linkBalance && linkBalance}</div></h4></div>
        {tokenBalances && tokenBalances.map((token, i) => (
          <div key={i} className={`mt-2 col-lg-3 col-10 p-4 rounded infoBox`}><h4 className='lead text-center'><b className='text-secondary fs-6'>{token.name}</b><br/><div className='mt-2'>{token.balance/(10**token.decimals)}</div></h4></div>
        ))}
      </div>
      {/* <!-- Button trigger modal --> */}
      <button type="button" className="btn btn-primary mt-3" data-bs-toggle="modal" data-bs-target="#exampleModal">
        Add Funds
      </button>
      <button type="button" className="btn btn-dark mt-3 ms-2" data-bs-toggle="modal" data-bs-target="#exampleModal2">
        Withdraw Funds
      </button>

      {/* <!-- Modal1 Adding--> */}
      <div className="modal fade" id="exampleModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">Add Funds</h1>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <label className='form-label'>Amount to Fund</label>
              <input type='number' className="form-control mb-2" onChange={(e) => setAmountToFund(e.target.value)} />
              <label className='form-label'>Select Token</label>
              <select
              id='inputState'
              className='form-select mb-2'
              onChange={(e) => setAddFundsToken(e.target.value)}
              >
              <option>
                Choose...
              </option>
              <option value={LINK}>
                LINK (For Automation)
              </option>
              {chain.id == 1 || chain.id == 5 && <option value={USDC}>
                USDC
              </option>}
              <option value={BUSD}>
                BUSD
              </option>
            </select>
            <div className="d-grid gap-2">
              <button className="btn btn-primary" type="button" onClick={addFunds}>{addingFunds ? 
              <>
              <span
                className='spinner-border spinner-border-sm me-2'
                role='status'
                aria-hidden='true'
              ></span>
              Adding
            </> : <span>Add Funds</span>}</button>
            </div>
            </div>
          </div>
        </div>
      </div>


{/* <!-- Modal2 - Withdrawing --> */}
    <div className="modal fade" id="exampleModal2" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h1 className="modal-title fs-5" id="exampleModalLabel">Withdraw Funds</h1>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div className="modal-body">
                  <label className='form-label'>Amount to Withdraw</label>
                  <input type='number' className="form-control mb-2" onChange={(e) => setAmountToWithdraw(e.target.value)} />
                  <label className='form-label'>Select Token</label>
                  <select
                  id='inputState'
                  className='form-select mb-2'
                  onChange={(e) => setWithdrawFundsToken(e.target.value)}
                  >
                  <option>
                    Choose...
                  </option>
                  {chain.id == 1 || chain.id == 5 && <option value={USDC}>
                    USDC
                  </option>}
                  <option value={BUSD}>
                    BUSD
                  </option>
                </select>
                <div className="d-grid gap-2">
                  <button className="btn btn-primary" type="button" onClick={withdrawFunds}>{withdrawingFunds ? 
                  <>
                  <span
                    className='spinner-border spinner-border-sm me-2'
                    role='status'
                    aria-hidden='true'
                  ></span>
                  Withdrawing
                </> : <span>Withdraw Funds</span>}</button>
                </div>
                </div>
              </div>
            </div>
          </div>
      {/* <button className='btn btn-danger'>Test</button> */}
      <h3 className='mt-5'>Employees</h3>
      <hr />
      {loadingEmployees ? <div className='text-center'><span
                className='spinner-border spinner-border-sm me-2'
                role='status'
                aria-hidden='true'
              ></span>Loading...</div> : allEmployees.length !== 0 ? <table className="table">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Employee Address</th>
                  <th scope="col">Salary</th>
                  <th scope="col">Paid In</th>
                  <th scope="col">Next Payment(GMT)</th>
                  <th scope="col">Payment Interval</th>
                  <th scope="col"></th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {/* // TODO: Need to change token and Salary dynamically so that the employer understands */}
                {allEmployees?.map((employee, i) => 
                (
                  <Employee key={i} id={i} employee={employee} employeeAddresses={employeeAddresses} vaultContract={vaultContract} USDC={USDC} BUSD={BUSD} moralisChain={moralisChain}/>
                ))}
              </tbody>
            </table> : <div className='text-center'>No Employees Added.</div>}
      

      
      <AddEmployeeForm vaultContract={vaultContract} USDC={USDC} BUSD={BUSD} moralisChain={moralisChain} addingEmployee={addingEmployee} setAddingEmployee={setAddingEmployee}/>
    </div>
  );
};

export default Dashboard;
