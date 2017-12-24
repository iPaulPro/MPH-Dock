module.exports = Object.freeze({
  DEBUG: true,
  API_KEY: process.env.API_KEY, // Your Mining Pool Hub API key, found at https://miningpoolhub.com/?page=account&action=edit
  FIAT: process.env.FIAT, // The currency to display balances in (USD, EUR, GBP, etc.)
  AUTO_EXCHANGE: process.env.AUTO_EXCHANGE, // The currency symbol used with Auto Exchange (BTC, ETH, LTC, etc.)
});