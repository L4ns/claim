const Web3 = require('web3');
const axios = require('axios');

// Menghubungkan ke jaringan Ethereum menggunakan URL langsung
const web3 = new Web3(new Web3.providers.HttpProvider('https://testnet-rpc.haven1.org/'));

// Fungsi untuk menunggu waktu tertentu
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Menampilkan hitung mundur
function displayCountdown(seconds) {
  process.stdout.write(`\rRetrying in ${seconds} seconds...`);
  const interval = setInterval(() => {
    seconds--;
    if (seconds <= 0) {
      clearInterval(interval);
      process.stdout.write('\rRetrying now...           \n');
    } else {
      process.stdout.write(`\rRetrying in ${seconds} seconds...`);
    }
  }, 1000);
}

// Mendapatkan transaksi terakhir berdasarkan alamat
async function getLastTransaction(address) {
  const response = await web3.eth.getPastLogs({
    fromBlock: 'latest',
    address: '0x562A7ec79BD2D1677770d67F3B41f912BECBf478',
    topics: [web3.utils.sha3('Transfer(address,address,uint256)'), null, web3.utils.padLeft(address, 64)]
  });
  if (response.length > 0) {
    const lastLog = response[response.length - 1];
    const block = await web3.eth.getBlock(lastLog.blockNumber);
    return { timestamp: block.timestamp };
  }
  return null;
}

// Mendapatkan waktu hitung mundur dari website
async function getCountdownFromWebsite() {
  try {
    const response = await axios.get('https://testnet.haven1.org/faucet');
    const match = response.data.match(/<button id="faucet-cta-request_h1"[^>]*disabled="">[^<]*Get Testnet H1 in (\d+ h)/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const seconds = hours * 60 * 60;
      return seconds;
    }
  } catch (error) {
    console.error('Error fetching countdown from website:', error.message);
  }
  return null;
}

module.exports = {
  web3,
  sleep,
  displayCountdown,
  getLastTransaction,
  getCountdownFromWebsite
};
