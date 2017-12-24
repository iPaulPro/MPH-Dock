"use strict";

const {ipcRenderer, shell} = require('electron');

const _ = require('underscore')
  , fs = require('fs')
  , path = require("path")
  , ejs = require('ejs')
  , Stats = require('../app/stats')
  , coins = require('../app/coins.json')
  , constants = require('../app/constants');

const nodeConsole = require('console')
  , logger = new nodeConsole.Console(process.stdout, process.stderr);

// Refresh every 10 minutes
const interval = 10 * 60 * 1000;
setInterval(update, interval);

function init() {
  if (constants.DEBUG) logger.log('init');
  update();
}

function update() {
  let stats = new Stats(constants.API_KEY, constants.FIAT, constants.AUTO_EXCHANGE);
  if (constants.DEBUG) logger.log('update stats=', JSON.stringify(stats));

  let coin = _.find(coins, (coin) => { return coin.code === constants.AUTO_EXCHANGE });
  if (constants.DEBUG) logger.log('update coin=', JSON.stringify(coin));

  stats.getDashboard(coin.name).then( (dashboard) => {
    if (constants.DEBUG) logger.log('update : dashboard =', JSON.stringify(dashboard));

    let data = dashboard.getdashboarddata.data;
    ipcRenderer.send("mph-stats-updated", {coin: coin, dashboard: data});

    return stats.getUserBalances();

  }).then( (balances) => {
    if (constants.DEBUG) logger.log('update : balances =', JSON.stringify(balances));

    let data = balances.getuserallbalances.data;
    updateView(data);

  }).catch( (error) => {
    ipcRenderer.send("on-error", { error: error });
    if (constants.DEBUG) logger.error(error);
  });
}

const updateView = (balances) => {
  let data = { balances: balances };

  data.balances = _.chain(data.balances)
    .map((balance) => {
      balance.coin = _.find(coins, (coin) => {
        return balance.coin === coin.name;
      });
      return balance;
    })
    .sortBy((balance) => { return balance.coin.code })
    .sortBy((balance) => { return balance.coin.code !== constants.AUTO_EXCHANGE})
    .value();

  logger.log('data', JSON.stringify(data));

  // let options = {root: path.join(__dirname, '..', 'views')};
  let template = path.join(__dirname, '..', 'views/balances.ejs');
  ejs.renderFile(template, data, function (err, str) {
    if (err) throw err;
    document.getElementById('balances').innerHTML = str;
  });

};

// Update when loaded
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('click', (event) => {
  if (constants.DEBUG) logger.log('click');
  if (event.target.href) {
    // Open links in external browser
    shell.openExternal(event.target.href);
    event.preventDefault();
  } else if (event.target.classList.contains('js-refresh-action')) {
    update();
  } else if (event.target.classList.contains('js-quit-action')) {
    window.close();
  }
});