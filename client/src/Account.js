import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useNetwork, useAccount } from 'wagmi';
import masterEthContractAbi from './contractsData/EthMaster.json';
import masterBscContractAbi from './contractsData/BscMaster.json';
import registryContractAbi from './contractsData/AutomationRegistryInterface.json';
import IKeeperRegistry from './contractsData/IKeeperRegistry.json'
import vaultEthContractAbi from './contractsData/EthVault.json';
import vaultBscContractAbi from './contractsData/BscVault.json';

const Account = () => {
  const { chain } = useNetwork();
  const [signer, setSigner] = useState();
  const { address } = useAccount();
  const [contract, setContract] = useState();
  const [canceling, setCanceling] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [registryContract, setRegistryContract] = useState();
  const [vaultContract, setVaultContract] = useState();
  const [keeperRegistryContract, setKeeperRegistryContract] = useState();
  const [isCanceled, setIsCanceled] = useState(false);
  const [isExists, setIsExists] = useState(false);
  const [linkBalance, setLinkBalance] = useState();
  const [loading, setLoading] = useState(false)

  const registry =
  chain &&
  (chain.id == 5 || chain.id == 1
    ? '0x02777053d6764996e594c3E88AF1D58D5363a2e6'
    : '0x02777053d6764996e594c3E88AF1D58D5363a2e6');

  useEffect(() => {
    loadContract();
  }, []);

  useEffect(() => {
    if (contract != undefined) {
      loadVaultContract();
    }
  }, [contract]);

  useEffect(() => {
    if(vaultContract != undefined && contract != undefined){
      loadOtherContracts()
    }
  },[vaultContract, contract]);

  const loadContract = async () => {
    try {
      setLoading(true)
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      setSigner(signer);
      // TODO: Change to mainnet and bsc
      const contractAddress =
        chain &&
        (chain.id == 5 || chain.id == 1
          ? process.env.REACT_APP_CONTRACT_ADDRESS_ETH
          : process.env.REACT_APP_CONTRACT_ADDRESS_BSC);

      const abi =
        chain &&
        (chain.id == 5 || chain.id == 1
          ? masterEthContractAbi
          : masterBscContractAbi);
      const Contract = new ethers.Contract(contractAddress, abi.abi, signer);
      setContract(Contract);
      console.log('contract loaded');
      const tx = await Contract.allVaults(address);
      if (tx == ethers.constants.AddressZero) {
        setIsExists(false);
      } else {
        setIsExists(true);
      }
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log(error);
    }
  };

  const loadVaultContract = async () => {
    try {
      console.log("loadVaultContract")
      const tx = await contract.allVaults(address);
      const vaultContractAddress = tx;
      if (vaultContractAddress != ethers.constants.AddressZero) {
        const abi = chain && (chain.id == 5 || chain.id == 1
          ? vaultEthContractAbi
          : vaultBscContractAbi);
        const VaultContract = new ethers.Contract(
          vaultContractAddress,
          abi.abi,
          signer
        );
        setVaultContract(VaultContract);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const loadOtherContracts = async () => {
    try {
      console.log("loadOtherContracts")
      const RegistryContract = new ethers.Contract(
        registry,
        registryContractAbi.abi,
        signer
      );
      setRegistryContract(RegistryContract);
      const keeperReg = new ethers.Contract(
        registry,
        IKeeperRegistry.abi,
        signer
      );
      setKeeperRegistryContract(keeperReg);
      const tx = await vaultContract.checkIfLinkIsWithdrawable();
      console.log(tx)
      setIsCanceled(tx);
      const upkeepId = await vaultContract.upkeepId();
      const tx2 = await RegistryContract.getUpkeep(upkeepId);
      setLinkBalance(tx2.balance);
    } catch (error) {
      console.log(error);
    }
  };

  const cancelVault = async () =>{
    try {
      setCanceling(true)
      const upkeepId = await vaultContract.upkeepId();
      if(upkeepId != 0){
        const tx = await registryContract.cancelUpkeep(upkeepId);
        await tx.wait()
      }
      alert("You can withdraw the remaining LINK in 15-20 minutes. Please come back then to find the withdraw button here on this page.")
      setCanceling(false)
    } catch (error) {
      console.log(error)
      setCanceling(false)
    }
  }

  const withdrawLink = async () => {
    try {
      setWithdrawing(true)
      const upkeepId = await vaultContract.upkeepId();
      if(upkeepId != 0){
        const tx = await keeperRegistryContract.withdrawFunds(upkeepId,address);
        await tx.wait();
      }
      setWithdrawing(false)
      alert("Success")
    } catch (error) {
      setWithdrawing(false)
      console.log(error)
    }
  }

  
  return (
    <div>
      {loading ? <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div> : <>{isExists ? <><h2 className='text-center mt-5'>Account</h2>
      <div className='text-muted'>To receive all your LINK tokens back, you have to cancel your service. Kindly note that you can only withdraw the LINK tokens 15-20 minutes after you cancel the service with us.</div>
      <div className='w-50 m-auto d-grid gap-2 mt-4'>
      {linkBalance != 0 && <>
      {isCanceled ? <button
                className='btn btn-dark'
                id='button-addon2'
                onClick={withdrawLink}
              >
                {withdrawing ? (
                  <>
                    <span
                      className='spinner-border spinner-border-sm me-2'
                      role='status'
                      aria-hidden='true'
                    ></span>
                    Withdrawing
                  </>
                ) : (
                  <span>Withdraw</span>
                )}
              </button> : <button
                className='btn btn-danger'
                id='button-addon2'
                onClick={cancelVault}
              >
                {canceling ? (
                  <>
                    <span
                      className='spinner-border spinner-border-sm me-2'
                      role='status'
                      aria-hidden='true'
                    ></span>
                    Canceling
                  </>
                ) : (
                  <span>Cancel Payroll Service</span>
                )}
              </button>}</>}
              
      </div></> : <h2 className='mt-5 text-center'>You currently don't have a payroll service created! Create one from the Home page</h2>}</>}
      
      
    </div>
  );
};

export default Account;
