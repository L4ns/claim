const axios = require('axios');
const Web3 = require('web3');
const { getLastTransaction, getCountdownFromWebsite, sleep, displayCountdown } = require('./utils');
require('dotenv').config();

const web3 = new Web3(new Web3.providers.HttpProvider('https://testnet-rpc.haven1.org/'));

async function getAuthSignature(address) {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey || privateKey.length !== 64) {
    throw new Error("Private key must be 32 bytes long (64 hex characters)");
  }

  if (!address) {
    throw new Error("Address is required");
  }

  try {
    const nonceResponse = await axios.get('https://auth-api.testnet.haven1.org/v1/auth/nonce', {
      params: { address }
    });
    const nonce = nonceResponse.data.nonce;

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    const signature = await web3.eth.personal.sign(nonce, account.address, privateKey);

    console.log('Signature obtained successfully. Please confirm the transaction in your wallet.');
    return signature;
  } catch (error) {
    console.error(`Error during authentication: ${error.message}`);
    throw error;
  }
}

async function claimFaucet(signature) {
  try {
    const response = await axios.post('https://api.testnet.haven1.org/v2/faucet/can-request-tokens', { address: process.env.ADDRESS, signature });

    if (response.status === 200) {
      if (response.data.success) {
        console.log('Faucet claimed successfully:', response.data.message);
        if (response.data.txHash) {
          console.log('Transaction Hash:', response.data.txHash);
        }
        return { success: true };
      } else if (response.data.message && response.data.message.includes('already claimed')) {
        const nextClaimTime = new Date(response.data.nextClaimTime);
        console.log('Faucet already claimed. You need to wait 24 hours to claim again.');
        return { success: false, nextClaimTime: nextClaimTime };
      } else {
        console.log('Failed to claim faucet:', response.data.message);
        return { success: false };
      }
    } else {
      console.log('Failed to claim faucet:', response.status, response.statusText);
      return { success: false };
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      console.error('Error during authentication: Request failed with status code 400. Checking blockchain history or website for countdown...');

      const lastTransaction = await getLastTransaction(process.env.ADDRESS);
      if (lastTransaction) {
        const lastTimestamp = lastTransaction.timestamp * 1000;
        const nextClaimTime = lastTimestamp + (24 * 60 * 60 * 1000);
        const waitTime = nextClaimTime - Date.now();
        if (waitTime > 0) {
          console.log(`Waiting ${waitTime / (60 * 1000)} minutes before the next attempt based on blockchain history...`);
          displayCountdown(Math.floor(waitTime / 1000));
          await sleep(waitTime);
          return { success: false, retry: true };
        }
      }

      const countdownSeconds = await getCountdownFromWebsite();
      if (countdownSeconds) {
        console.log(`Waiting ${countdownSeconds / 60} minutes before the next attempt based on website countdown...`);
        displayCountdown(countdownSeconds);
        await sleep(countdownSeconds * 1000);
        return { success: false, retry: true };
      }

      console.log('Fallback: No valid countdown found.');
      return { success: false };
    } else {
      console.error('Error claiming faucet:', error.message);
      return { success: false };
    }
  }
}

async function claimGM() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey || privateKey.length !== 64) {
    throw new Error("Private key must be 32 bytes long (64 hex characters)");
  }

  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  const proxyContractAddress = '0x86e888e3d8179c3d9E4fba15BcEc164C40B7cF37';
  const implementationContractAddress = '0x816c27b5E38a97B4563b011c89239a6Cd8781e77';

  const proxyContractABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_logic",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "_data",
                "type": "bytes"
            }
        ],
        "stateMutability": "payable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "previousAdmin",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "newAdmin",
                "type": "address"
            }
        ],
        "name": "AdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "beacon",
                "type": "address"
            }
        ],
        "name": "BeaconUpgraded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            }
        ],
        "name": "Upgraded",
        "type": "event"
    },
    {
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "stateMutability": "payable",
        "type": "receive"
    }
];

  const implementationContractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "DailyStreak__CanNotRepairStreak",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "currentTimestamp",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "canContinueAtTimestamp",
                "type": "uint256"
            }
        ],
        "name": "DailyStreak__TooEarlyTooContinueStreak",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "H1NativeBase__AlreadyInitialized",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "fundsInContract",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "currentFee",
                "type": "uint256"
            }
        ],
        "name": "H1NativeBase__InsufficientFunds",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "H1NativeBase__InvalidFeeContract",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "address",
                "name": "previousAdmin",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "newAdmin",
                "type": "address"
            }
        ],
        "name": "AdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "beacon",
                "type": "address"
            }
        ],
        "name": "BeaconUpgraded",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "feeContractAddressNew",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "feeContractAddressPrev",
                "type": "address"
            }
        ],
        "name": "FeeAddressUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint8",
                "name": "version",
                "type": "uint8"
            }
        ],
        "name": "Initialized",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "oldAddress",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newAddress",
                "type": "address"
            }
        ],
        "name": "ParticipationTokenUpdated",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "previousAdminRole",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "newAdminRole",
                "type": "bytes32"
            }
        ],
        "name": "RoleAdminChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "RoleGranted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "account",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            }
        ],
        "name": "RoleRevoked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "streakContinueTimestamp",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint24",
                "name": "daysInStreak",
                "type": "uint24"
            },
            {
                "indexed": false,
                "internalType": "uint24",
                "name": "streakTotal",
                "type": "uint24"
            }
        ],
        "name": "StreakContinued",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "StreakRepaired",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "implementation",
                "type": "address"
            }
        ],
        "name": "Upgraded",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "DEFAULT_ADMIN_ROLE",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "TIME_TO_REPAIR",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "canContinueStreak",
        "outputs": [
            {
                "internalType": "bool",
                "name": "canContinue",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "continueStreakTimestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "canRepairStreak",
        "outputs": [
            {
                "internalType": "bool",
                "name": "canRepair",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "lastStreakContinuedTimestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "continueStreak",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            }
        ],
        "name": "getRoleAdmin",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getStreak",
        "outputs": [
            {
                "internalType": "uint24",
                "name": "",
                "type": "uint24"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getStreakHistory",
        "outputs": [
            {
                "internalType": "uint256[7]",
                "name": "orderedHistory",
                "type": "uint256[7]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getStreakTotal",
        "outputs": [
            {
                "internalType": "uint24",
                "name": "",
                "type": "uint24"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "grantRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "hasRole",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "feeContract",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "association",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "participationToken",
                "type": "address"
            }
        ],
        "name": "initialize",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "isStreakActive",
        "outputs": [
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "streakExpiryTimestamp",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "proxiableUUID",
        "outputs": [
            {
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "renounceRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "repairStreak",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "role",
                "type": "bytes32"
            },
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "revokeRole",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "bytes4",
                "name": "interfaceId",
                "type": "bytes4"
            }
        ],
        "name": "supportsInterface",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "feeContract",
                "type": "address"
            }
        ],
        "name": "updateFeeContractAddress",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "participationToken",
                "type": "address"
            }
        ],
        "name": "updateParticipationToken",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newImplementation",
                "type": "address"
            }
        ],
        "name": "upgradeTo",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newImplementation",
                "type": "address"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "upgradeToAndCall",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    }
];

  const proxyContract = new web3.eth.Contract(proxyContractABI, proxyContractAddress);
  const implementationContract = new web3.eth.Contract(implementationContractABI, implementationContractAddress);

  try {
    console.log('Estimating gas and value for transaction...');
    const gasLimit = await implementationContract.methods.continueStreak().estimateGas({ from: process.env.ADDRESS });
    const gasPrice = await web3.eth.getGasPrice();

    console.log('Sending transaction to claim GM...');
    const tx = await implementationContract.methods.continueStreak().send({
      from: process.env.ADDRESS,
      gas: gasLimit,
      gasPrice: gasPrice
    });

    console.log(`Transaction successful with hash: ${tx.transactionHash}`);
    return { success: true, txHash: tx.transactionHash };
  } catch (error) {
    if (error.message.includes('execution reverted')) {
      console.error('Error during transaction: Daily GM already claimed. Waiting for the next claim period...');

      const nextClaimTime = Date.now() + 24 * 60 * 60 * 1000;
      const waitTime = nextClaimTime - Date.now();
      displayCountdown(Math.floor(waitTime / 1000));
      await sleep(waitTime);

      return { success: false, retry: true };
    } else {
      console.error(`Error during transaction: ${error.message}`);
      return { success: false };
    }
  }
}

module.exports = {
  getAuthSignature,
  claimFaucet,
  claimGM
};
