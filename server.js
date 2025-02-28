const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { getAuthSignature, claimFaucet, claimGM } = require('./src/claims');

dotenv.config();

const app = express();
app.use(bodyParser.json());

app.post('/auth', async (req, res) => {
  try {
    const { address } = req.body;
    const signature = await getAuthSignature(address);
    res.status(200).json({ signature });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/claim-faucet', async (req, res) => {
  try {
    const { signature } = req.body;
    const result = await claimFaucet(signature);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/claim-gm', async (req, res) => {
  try {
    const result = await claimGM();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
