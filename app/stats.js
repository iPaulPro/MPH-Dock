const _ = require('underscore');
const coins = require('../app/coins.json');
const constants = require('./constants');

class Stats {

  constructor(apiKey, fiat, autoExchange) {
    this.apiKey = apiKey;
    this.fiat = fiat;
    this.autoExchange = autoExchange;
  }

  static getCoinCodeArray() {
    return _.pluck(coins, "code");
  }

  getPrices() {
    let fsyms = Stats.getCoinCodeArray();
    let fiat = constants.FIAT;
    let url = "https://min-api.cryptocompare.com/data/pricemulti?fsyms=${fsyms}&tsyms=${fiat}";

    return fetch(url).then((response) => {
      if (response.status !== 200) {
        return Promise.reject(response.status);
      }
      return response.json();
    });
  }

  getUserBalances() {
    let apiKey = constants.API_KEY;
    let url = "https://miningpoolhub.com/index.php?page=api&action=getuserallbalances&api_key=${apiKey}";

    return fetch(url).then((response) => {
      if (response.status !== 200) {
        return Promise.reject(response.status);
      }
      return response.json();
    });
  }

  getDashboard(coin) {
    let apiKey = constants.API_KEY;
    let url = "https://${coin}.miningpoolhub.com/index.php?page=api&action=getdashboarddata&api_key=${apiKey}";

    return fetch(url).then((response) => {
      if (response.status !== 200) {
        return Promise.reject(response.status);
      }
      return response.json();
    });
  }


}