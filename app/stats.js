"use strict";

const fetch = require('node-fetch');

/**
 * Main model for accessing Multi Pool Miner data
 */
class Stats {

  /**
   * Creates a Stats object to access a user's data from Multi Pool Miner
   *
   * @param apiKey The user's MPH API key
   * @param fiat The currency symbol used to display balances (USD, EUR, GBP, etc.)
   * @param autoExchange The currency symbol used with Auto Exchange (BTC, ETH, LTC, etc.)
   */
  constructor(apiKey, fiat, autoExchange) {
    this.apiKey = apiKey;
    this.fiat = fiat;
    this.autoExchange = autoExchange;
  }

  /**
   * Returns a Promise that resolves to the current spot prices for the symbols in coins.json,
   * provided by CryptoCompare API.
   *
   * @param coinCodeArray An array of codes for coins to include in the price lookup
   */
  getPrices(coinCodeArray) {
    let url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinCodeArray}&tsyms=${this.fiat}`;

    return fetch(url).then((response) => {
      if (response.status !== 200) {
        return Promise.reject(response.status);
      }
      return response.json();
    });
  }

  /**
   * Returns a Promise that resolves to the current user balances on Mining Pool Hub
   */
  getUserBalances() {
    let url = `https://miningpoolhub.com/index.php?page=api&action=getuserallbalances&api_key=${this.apiKey}`;
    return fetch(url).then((response) => {
      if (response.status !== 200) {
        return Promise.reject(response.status);
      }
      return response.json();
    });
  }

  /**
   * Returns a Promise that resolves to the dashboard snapshot of the given coin, for a user on Mining Pool Hub.
   * @param coin The coin to retrieve dashboard statistics for.
   */
  getDashboard(coin) {
    if (!coin) { coin = this.autoExchange }

    const url = `https://${coin}.miningpoolhub.com/index.php?page=api&action=getdashboarddata&api_key=${this.apiKey}`;
    return fetch(url).then((response) => {
      if (response.status !== 200) {
        return Promise.reject(response.status);
      }
      return response.json();
    });
  }

}

module.exports = Stats;