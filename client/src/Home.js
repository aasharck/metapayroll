import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useNetwork } from 'wagmi';
import Dashboard from './components/Dashboard';
import { useAccount } from 'wagmi';
import masterEthContractAbi from './contractsData/EthMaster.json';
import masterBscContractAbi from './contractsData/BscMaster.json';
import vaultEthContractAbi from './contractsData/EthVault.json';
import vaultBscContractAbi from './contractsData/BscVault.json';
import linkContractAbi from './contractsData/LinkTokenInterface.json';
import registryContractAbi from './contractsData/AutomationRegistryInterface.json';
import IKeeperRegistry from './contractsData/IKeeperRegistry.json'

const Home = () => {
    const { address, isDisconnected } = useAccount();
    const [contract, setContract] = useState();
    const [signer, setSigner] = useState();
    const [vaultContract, setVaultContract] = useState();
    const [linkContract, setLinkContract] = useState();
    const [registryContract, setRegistryContract] = useState();
    const [keeperRegistryContract, setKeeperRegistryContract] = useState();
    const [creatingVault, setCreatingVault] = useState(false);
    const [isExists, setIsExists] = useState(false);
    const [vaultLoading, setVaultLoading] = useState(false)
    const { chain } = useNetwork();

    // TODO: Limit The chain to be switched between bsc and eth

    // TODO: All the values are for testnets, change to mainnet
  const LINK =
  chain &&
  (chain.id == 5 || chain.id == 1
    ? '0x326C977E6efc84E512bB9C30f76E30c160eD06FB'
    : '0x84b9B910527Ad5C03A9Ca831909E21e236EA7b06');
const registry =
  chain &&
  (chain.id == 5 || chain.id == 1
    ? '0x02777053d6764996e594c3E88AF1D58D5363a2e6'
    : '0x02777053d6764996e594c3E88AF1D58D5363a2e6');
const USDC =
  chain &&
  (chain.id == 5 || chain.id == 1
    ? '0x1Bf831e1462335A3874c6849Db254B85F90554fD'
    : '');
const BUSD =
  chain &&
  (chain.id == 5 || chain.id == 1
    ? '0xb809b9B2dc5e93CB863176Ea2D565425B03c0540'
    : '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee');

const TOKEN =
    chain &&
    (chain.id == 5 || chain.id == 1
      ? 'USDC'
      : 'BUSD');
const moralisChain =
  chain &&
  ((chain.id == 1 && 'eth') ||
    (chain.id == 5 && 'goerli') ||
    (chain.id == 56 && 'bsc') ||
    (chain.id == 97 && 'bsc testnet'));


useEffect(() => {
  loadContracts();
}, [chain, address]);

useEffect(() => {
  if (contract != undefined) {
    loadVaultContract();
    loadOtherContracts();
  }
},[contract])

useEffect(() => {
  if (contract != undefined) {
    checkIfVaultExistsForThisAddress()
  }
},[contract])

if (contract != undefined) {
  contract.on("VaultCreated", (owner,vaultAddress)=>{
    checkIfVaultExistsForThisAddress();
    loadVaultContract();
    console.log(owner,vaultAddress)
  })
}




const loadContracts = async () => {
  try {
    console.log("loadContracts")
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    setSigner(signer);
    // TODO: Change to mainnet and bsc
    const contractAddress =
      chain && (chain.id == 5 || chain.id == 1
        ? process.env.REACT_APP_CONTRACT_ADDRESS_ETH
        : process.env.REACT_APP_CONTRACT_ADDRESS_BSC);

    const abi = chain && (chain.id == 5 || chain.id == 1
      ? masterEthContractAbi
      : masterBscContractAbi);
    const Contract = new ethers.Contract(
      contractAddress,
      abi.abi,
      signer
    );
    setContract(Contract);
  } catch (error) {
    console.log(error);
  }
};

const loadVaultContract = async () => {
  try {
    console.log("loadVaultContract")
    const tx = await contract.allVaults(address);
    if (tx != ethers.constants.AddressZero) {
      const abi = chain && (chain.id == 5 || chain.id == 1
        ? vaultEthContractAbi
        : vaultBscContractAbi);
      const VaultContract = new ethers.Contract(
        tx,
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
    const LinkContract = new ethers.Contract(
      LINK,
      linkContractAbi.abi,
      signer
    );
    setLinkContract(LinkContract);
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
  } catch (error) {
    console.log(error);
  }
};



const checkIfVaultExistsForThisAddress = async () => {
  try {
    console.log("checkIfVaultExistsForThisAddress")
    setVaultLoading(true)
    console.log(address)
    const tx = await contract.allVaults(address);
    if (tx == ethers.constants.AddressZero) {
      setIsExists(false);
    } else {
      setIsExists(true);
    }
    setVaultLoading(false)
  } catch (error) {
    setVaultLoading(false)
    console.log(error);
  }
};

const createVault = async () => {
  try {
    setCreatingVault(true);
    const tx = await contract.createVault();
    await tx.wait();
    alert('Payroll Service Created');
    setCreatingVault(false);
  } catch (error) {
    alert("Error! Please try again later")
    setCreatingVault(false);
    console.log(error);
  }
};

const renderRegisteredContainer = () => {
  return (
    <div>
      <Dashboard
        address={address}
        signer={signer}
        vaultContract={vaultContract}
        linkContract={linkContract}
        registryContract={registryContract}
        LINK={LINK}
        USDC={USDC}
        BUSD={BUSD}
        moralisChain={moralisChain}
        keeperRegistryContract={keeperRegistryContract}
      />
    </div>
  );
};

const renderNotRegisteredContainer = () => {
  return (
    <div className='text-center pt-5'>
      <h2>Create Payroll</h2>
      <p>Create a Payroll service by clicking the button below</p>
      <div className='col-md-4 m-auto mt-5'>
          <div className="d-grid gap-2">
        <button className='btn btn-outline-primary' id="button-addon2" onClick={createVault}>
        {creatingVault ? (
          <>
            <span
              className='spinner-border spinner-border-sm me-2'
              role='status'
              aria-hidden='true'
            ></span>
            Creating
          </>
        ) : (
          <span>Create Payroll Service</span>
        )}
        </button>  
        </div>      
        </div>
      
    </div>
  );
};

  return (
    <div>
        {isDisconnected ? (
        <h2 className='text-center mt-5'>
          Please Connect Your Wallet to Access this App!
        </h2>
      ) : (
        <>
        {vaultLoading ? <div className="d-flex justify-content-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div> : ( <div className='mt-5'>
        {isExists == true
          ? renderRegisteredContainer()
          : renderNotRegisteredContainer()}
      </div>)}
      </>)}
    </div>
  )
}

export default Home