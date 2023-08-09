// tronAPI.js
const axios = require('axios');

const TRON_API_BASE_URL = 'https://api.trongrid.io/v1';

// Function to get transaction info by account address
async function getTransactionsByAddress(address) {
  try {
    const response = await axios.get(`${TRON_API_BASE_URL}/accounts/${address}/transactions/trc20`);
    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch transaction info for the given address.');
  }
}

module.exports = { getTransactionsByAddress };