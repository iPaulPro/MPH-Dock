"use strict";

const {ipcRenderer, shell} = require('electron');

const POSITION_BALANCES = 0
  , POSITION_CREDITS = POSITION_BALANCES + 1;

const path = require("path")
  , ejs = require('ejs')
  , moment = require('moment');

let timer
  , refreshInterval;

let sendSetupRequest = () => {
  console.log('sendSetupRequest');
  ipcRenderer.send('setup');
};

let sendUpdateRequest = () => {
  ipcRenderer.send('update');
};

let setRefreshTimer = () => {
  if (!refreshInterval) { return; }
  if (timer) { clearInterval(timer) }

  const interval = refreshInterval * 60 * 1000; // minutes
  timer = setInterval(sendUpdateRequest, interval);
};

let setupTabs = () => {
  let tabs = document.getElementsByClassName("tab-group")[0];
  let balances = document.getElementById('balances');
  let credits = document.getElementById('credits');

  balances.style.display = "block";

  tabs.addEventListener("tabActivate", (event) => {
    let position = event.detail.tabPosition;
    balances.style.display = position === POSITION_BALANCES ? "block" : "none";
    credits.style.display = position === POSITION_CREDITS ? "block" : "none";
  }, false);
};

let init = () => {
  console.log('init', JSON.stringify(new Date()));

  setupTabs();
  setRefreshTimer();
  sendUpdateRequest();
};

// Update when loaded
document.addEventListener('DOMContentLoaded', init);

let showSetup = () => {
  let setupDiv = document.getElementById('setup');
  setupDiv.style.display = "block";

  document.getElementById('main').style.display = "none";
  document.getElementById('footer').style.display = "none";

  return setupDiv;
};

let showMain = () => {
  document.getElementById('setup').style.display = "none";
  document.getElementById('main').style.display = "block";
  document.getElementById('footer').style.display = "block";
};

document.addEventListener('click', (event) => {
  console.log('click');
  if (event.target.href) {
    // Open links in external browser
    shell.openExternal(event.target.href);
    event.preventDefault();
  } else if (event.target.classList.contains('js-refresh-action')) {
    setRefreshTimer();
    sendUpdateRequest();
  } else if (event.target.classList.contains('js-settings-action')) {
    sendSetupRequest();
  } else if (event.target.classList.contains('js-setup-cancel-action')) {
    showMain();
  } else if (event.target.classList.contains('js-quit-action')) {
    window.close();
  }
});

let updateDashboardView = (dashboard, coin) => {
  let data = { dashboard: dashboard, coin: coin };
  let template = path.join(__dirname, 'views', 'dashboard.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;
    document.getElementById('dashboard').innerHTML = html;
  });
};

let updateCreditsView = (dashboard) => {
  let credits = dashboard.recent_credits;
  let data = { credits: credits };
  let template = path.join(__dirname, 'views', 'credits.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;
    document.getElementById('credits').innerHTML = html;
  });
};

let updateBalancesView = (balances) => {
  let data = { balances: balances };
  let template = path.join(__dirname, 'views', 'balances.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;
    document.getElementById('balances').innerHTML = html;
  });
};

let updateWorkersView = (workers) => {
  let data = { workers: workers };
  let template = path.join(__dirname, 'views', 'workers.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;
    document.getElementById('workers').innerHTML = html;
  });
};

let updateFooter = () => {
  let time = moment().format('h:mm a');
  let data = {lastUpdate: time};
  let template = path.join(__dirname, 'views', 'footer.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;
    document.getElementById('footer').innerHTML = html;
  });
};

let saveSetup = (form) => {
  let apiKey = form.apiKey.value;
  let autoExchange = form.autoExchange.value;
  refreshInterval = Number(form.refreshInterval.value);

  ipcRenderer.send('save-setup', apiKey, autoExchange, refreshInterval);

  setRefreshTimer();
};

let updateSetup = (data) => {
  refreshInterval = data.refreshInterval;

  let template = path.join(__dirname, 'views', 'setup.ejs');
  ejs.renderFile(template, data, function (err, html) {
    if (err) throw err;

    let setupDiv = showSetup();
    setupDiv.innerHTML = html;

    let form = document.getElementById('setup-form');
    form.addEventListener('submit', function(evt){
      evt.preventDefault();
      saveSetup(form);
    });
  });
};

ipcRenderer.on('setup-loaded', (event, data) => {
  console.log('setup-loaded', JSON.stringify(data));
  updateSetup(data);
});

ipcRenderer.on('dashboard-loaded', (event, coin, dashboard) => {
  console.log('dashboard-loaded coin = %s, dashboard = %s', JSON.stringify(coin), JSON.stringify(dashboard));
  updateDashboardView(dashboard, coin);
  updateCreditsView(dashboard);
});

ipcRenderer.on('balances-loaded', (event, balances) => {
  console.log('balances-loaded balances = %s', JSON.stringify(balances));
  updateBalancesView(balances);
});

ipcRenderer.on('workers-loaded', (event, workers) => {
  console.log('workers-loaded workers = %s', JSON.stringify(workers));
  updateWorkersView(workers);
});

ipcRenderer.on('update-complete', (event) => {
  console.log('update complete');
  updateFooter();
  showMain();
});

ipcRenderer.on('on-error', (event, error) => {
  console.error('on-error', error);
  updateFooter();
  showMain();
  // TODO
});