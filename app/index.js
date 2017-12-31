"use strict";

const {ipcRenderer, shell} = require('electron');

const path = require("path")
  , ejs = require('ejs')
  , moment = require('moment');

let timer;

let update = function () {
  ipcRenderer.send('update');
};

/**
 * Refresh every 10 minutes
 */
let setRefreshTimer = () => {
  if (timer) { clearInterval(timer) }

  const interval = 10 * 60 * 1000;
  timer = setInterval(update, interval);
};

function init() {
  console.log('init');

  setRefreshTimer();
  update();
}

// Update when loaded
document.addEventListener('DOMContentLoaded', init);

document.addEventListener('click', (event) => {
  console.log('click');
  if (event.target.href) {
    // Open links in external browser
    shell.openExternal(event.target.href);
    event.preventDefault();
  } else if (event.target.classList.contains('js-refresh-action')) {
    setRefreshTimer();
    update();
  } else if (event.target.classList.contains('js-quit-action')) {
    window.close();
  }
});

ipcRenderer.on('on-error', (event, error) => {
  console.error('on-error', error);
  // TODO
});

let updateDashboardView = function (dashboard, coin) {
  let data = { dashboard: dashboard, coin: coin };
  let template = path.join(__dirname, 'views', 'dashboard.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;
    document.getElementById('dashboard').innerHTML = html;
  });
};

ipcRenderer.on('dashboard-loaded', (event, coin, dashboard) => {
  console.log('dashboard-loaded coin = %s, dashboard = %s', coin, JSON.stringify(dashboard));
  updateDashboardView(dashboard, coin);
});

let updateBalancesView = (balances) => {
  let data = { balances: balances };
  let template = path.join(__dirname, 'views', 'balances.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;
    document.getElementById('balances').innerHTML = html;
  });
};

ipcRenderer.on('balances-loaded', (event, balances) => {
  console.log('balances-loaded balances = %s', JSON.stringify(balances));
  updateBalancesView(balances);
});

let updateFooter = () => {
  let time = moment().format('h:mm a');
  let data = {lastUpdate: time};
  let template = path.join(__dirname, 'views', 'footer.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;
    document.getElementById('footer').innerHTML = html;
  });
};

ipcRenderer.on('update-complete', (event) => {
  console.log('update complete');
  updateFooter();
});