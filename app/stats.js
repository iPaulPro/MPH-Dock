const _ = require('underscore');
const coins = require('../app/coins.json');
const constants = require('./constants');

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
   * @return {Array} The "code" fields from coins.json
   */
  static getCoinCodeArray() {
    return _.pluck(coins, "code");
  }

  /**
   * Returns a Promise that resolves to the current spot prices for the symbols in coins.json,
   * provided by CryptoCompare API.
   */
  getPrices() {
    let fsyms = Stats.getCoinCodeArray();
    let url = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=${fsyms}&tsyms=${fiat}";

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
    let url = "https://miningpoolhub.com/index.php?page=api&action=getuserallbalances&api_key=${apiKey}";

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
    let url = "https://${coin}.miningpoolhub.com/index.php?page=api&action=getdashboarddata&api_key=${apiKey}";

    return fetch(url).then((response) => {
      if (response.status !== 200) {
        return Promise.reject(response.status);
      }
      return response.json();
    });
  }


}