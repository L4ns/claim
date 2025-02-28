const dotenv = require('dotenv');
const { getAuthSignature, claimFaucet } = require('./src/claims');

dotenv.config();

async function main() {
  try {
    const address = process.env.ADDRESS;
    console.log(`[MAIN] Starting claim process for address: ${address}`);

    // Mendapatkan signature untuk autentikasi
    const signature = await getAuthSignature(address);
    console.log(`[MAIN] Signature obtained: ${signature}`);

    // Melakukan klaim faucet
    const result = await claimFaucet(signature);
    if (result.success) {
      console.log('[MAIN] Faucet claimed successfully!');
    } else if (result.nextClaimTime) {
      console.log(`[MAIN] Faucet already claimed. Next claim time: ${result.nextClaimTime}`);
    } else {
      console.log('[MAIN] Failed to claim faucet.');
    }
  } catch (error) {
    console.error(`[MAIN] Error: ${error.message}`);
  }
}

main();
