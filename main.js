"use strict";

const fs = require('fs');
if (fs.existsSync('.env')) require('dotenv').config();

const electron = require('electron');
const {app, BrowserWindow, ipcMain, Tray} = require('electron');

const _ = require('underscore')
  , path = require('path')
  , ejs = require('ejs')
  , AutoLaunch = require('auto-launch')
  , electronSettings = require('electron-settings')
  , Settings = require('./app/data/settings')
  , Stats = require('./app/data/stats')
  , coins = require('./app/data/coins.json')
  , constants = require('./app/data/constants');

let tray = undefined;
let window = undefined;
let settings = new Settings(electronSettings);

let init = () => {
  let appPath = app.getPath('exe').split('.app/Content')[0] + '.app';
  let mphDockAutoLauncher = new AutoLaunch({
    name: 'MPH Dock',
    path: appPath
  });

  mphDockAutoLauncher.enable();

  mphDockAutoLauncher.isEnabled()
    .then(function (isEnabled) {
      if (isEnabled) {
        return;
      }
      mphDockAutoLauncher.enable();
    })
    .catch(function (err) {
    });

  // Don't show the app in the dock
  app.dock.hide();
};

init();

const createTray = () => {
  let assetsDirectory = path.join(__dirname, 'assets');

  tray = new Tray(path.join(assetsDirectory, 'ic_miner.png'));
  tray.on('click', toggleWindow);

  if (constants.DEBUG) {
    tray.on('double-click', () => {
      window.webContents.openDevTools()
    });
  }
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 360,
    height: 450,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    transparent: true,
    webPreferences: {
      // Allows renderer process to run when window is hidden
      backgroundThrottling: false
    }
  });

  window.loadURL(`file://${path.join(__dirname, 'app', 'index.html')}`);

  // Hide the window when it loses focus
  window.on('blur', () => {
    if (!window.webContents.isDevToolsOpened()) {
      window.hide();
    }
  });

  window.on('show', () => {
    tray.setHighlightMode('always')
  });

  window.on('hide', () => {
    tray.setHighlightMode('never')
  });
};

app.on('ready', () => {
  if (constants.DEBUG) console.log('ready : coins = %s, constants = %s', JSON.stringify(coins), JSON.stringify(constants));

  createTray();
  createWindow();
});

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (window === null) {
    createWindow()
  }
});

const getWindowPosition = (trayBounds) => {
  const windowBounds = window.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return {x: x, y: y};
};

const showWindow = (trayBounds) => {
  const position = getWindowPosition(trayBounds);
  window.setPosition(position.x, position.y, false);
  window.show();
  window.focus();
};

const toggleWindow = (event, bounds) => {
  if (window.isVisible()) {
    window.hide();
  } else {
    showWindow(bounds);
  }
};

let setup = () => {
  let data = {
    coins: coins,
    apiKey: settings.getApiKey(),
    autoExchange: settings.getAutoExchange(),
    refreshInterval: settings.getRefreshInterval()
  };
  console.log('setup : sending', JSON.stringify(data));
  window.webContents.send('setup-loaded', data);
};

let update = () => {
  let apiKey = settings.getApiKey();
  let autoExchange = settings.getAutoExchange();

  if (!apiKey) {
    setup();
    return;
  }

  const stats = new Stats(apiKey, constants.FIAT, autoExchange);
  if (constants.DEBUG) console.log('update : stats=', JSON.stringify(stats));

  const coin = _.find(coins, (coin) => { return coin.code === autoExchange });
  if (constants.DEBUG) console.log('update : coin=', JSON.stringify(coin));

  stats.getDashboard(coin).then( (dashboard) => {
    if (constants.DEBUG) console.log('update : dashboard =', JSON.stringify(dashboard));

    let data = dashboard.getdashboarddata.data;
    if (data.error) { return Promise.reject(data.error) }

    let balance = Number(data.balance.confirmed).toFixed(4);

    tray.setTitle(balance + " " + coin.code);
    window.webContents.send('dashboard-loaded', coin, data);

    return stats.getUserBalances();

  }).then( (balances) => {
    if (constants.DEBUG) console.log('update : balances =', JSON.stringify(balances));

    let data = balances.getuserallbalances.data;
    if (data.error) { return Promise.reject(data.error) }

    try {
      data = _.chain(balances.getuserallbalances.data)
        .map((balance) => {
          balance.coin = _.find(coins, (coin) => {
            return balance.coin === coin.name;
          });
          return balance;
        })
        .sortBy((balance) => {
          return balance.coin.code;
        })
        .sortBy((balance) => {
          return balance.coin.code !== autoExchange;
        })
        .value();
    } catch (e) {}

    window.webContents.send('balances-loaded', data);

  // }).then( () => {
  //
  //   return stats.getWorkers(coins);
  //
  // }).then( (workers) => {
  //   if (constants.DEBUG) console.log('update : workers =', JSON.stringify(workers));
  //
  //   let data = workers.getuserworkers.data;
  //   if (data.error) { return Promise.reject(data.error) }
  //
  //   window.webContents.send('workers-loaded', data);

  }).then( () => {

    window.webContents.send('update-complete');

  }).catch( (error) => {
    if (constants.DEBUG) console.error("update : ", error);
    window.webContents.send("on-error", { error: error });
  });
};

ipcMain.on('setup', (event) => {
  if (constants.DEBUG) console.log('on setup', JSON.stringify(new Date()));
  setup();
});

ipcMain.on('update', (event) => {
  if (constants.DEBUG) console.log('on update', JSON.stringify(new Date()));
  update();
});

ipcMain.on('save-setup', (event, apiKey, autoExchange, refreshInterval) => {
  if (constants.DEBUG) console.log('saveSetup : apiKey = %s, autoExchange = %s, refresh = %s', apiKey, autoExchange, refreshInterval);
  settings.setApiKey(apiKey);
  settings.setAutoExchange(autoExchange);
  settings.setRefreshInterval(refreshInterval);

  update();
});
