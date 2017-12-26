"use strict";

const {ipcRenderer, shell} = require('electron');

const path = require("path")
  , ejs = require('ejs')
  , moment = require('moment');

let update = function () {
  ipcRenderer.send('update');
};

function init() {
  console.log('init');
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

    let time = moment().format('h:mm a');
    document.getElementById('footer-link').textContent = `Last update at ${time}`;
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