# AUTOMATIC PAYMENTS

## Overview

This app will basically allow any employers to automate their payroll with crypto payments. The app can be operated on any of the two networks - ethereum or binance smart chain.
There are 4 different contracts, 2 for each network.
One contract is called the master contract which basically manages the platform and the vault contract is the contract which performs all the payroll functionalities.
Each employer is able to create a vault by calling the create vault function.

## How to Run The App

### 1. Project setup

Clone the repo, change directory the folder and install all the dependencies using ```forge install```

Then, cd into the client folder and install all the dependencies with the command ```npm i```

### 2. Deploying the contracts(optional).

Contracts can be deployed by executing the below commands

For Ethereum - ```forge create src/EthMaster.sol:EthMaster --rpc-url <RPC_URL> --private-key <PRIVATE_KEY>```
For Binance - ```forge create src/BscMaster.sol:BscMaster --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ --private-key <PRIVATE_KEY>```

Once the contracts are deployed, you can copy the following files(ABIs) from the out folder to the client/src/contractsData folder
- AutomationRegistryInterface.json
- BscMaster.json
- BscVault.json
- EthMaster.json
- EthVault.json
- IERC20.json
- LinkTokenInterface.json

### 3. .env file

Fill all the useful api keys in the .env file as per the .env.example given.
Also, if you deployed new contracts, please change those two addresses also

### 4. Running the app

To the start the application, cd into the client folder and execute ```npm start```

Please connect to either goerli or binance testnet, then connect your wallet.
Once connected, choose a plan and click on create Vault button.

After the vault is created you will be able to interact with the main dashboard.

The first thing to do is it create the automation, to create the automation - you just need to click on add Funds and then choose LINK. This will create an upkeep in the background and also will fund the specified amount to the upkeep.

Once the upkeep is created, you can fund your contract with USDC or BUSD, to do so just follow the above step but choose any other token.

After that, you can add in the employees and also their details.

Once everything is done, the salary will be disbursed automatically to the employees.

