module.exports = Object.freeze({
  DEBUG: true,
  API_KEY: '', // Your Mining Pool Hub API key, found at https://miningpoolhub.com/?page=account&action=edit
  FIAT: 'USD', // The currency to display balances in (USD, EUR, GBP, etc.)
  AUTO_EXCHANGE: 'BTC', // The symbol of your Auto Exchange Coin (BTC, ETH, LTC, etc.)
  REFRESH_INTERVAL: 10  // The amount of time between automatic updates, in minutes.
});