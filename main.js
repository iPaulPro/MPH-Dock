"use strict";

const fs = require('fs');
if (fs.existsSync('.env')) require('dotenv').config();

const electron = require('electron');
const {app, BrowserWindow, ipcMain, Tray} = require('electron');

const _ = require('underscore')
  , path = require('path')
  , ejs = require('ejs')
  , AutoLaunch = require('auto-launch')
  , Stats = require('./app/data/stats')
  , coins = require('./app/data/coins.json')
  , constants = require('./app/data/constants');

let tray = undefined;
let window = undefined;

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

const createTray = () => {
  let assetsDirectory = path.join(__dirname, 'assets');
  tray = new Tray(path.join(assetsDirectory, 'ic_miner.png'));
  tray.on('click', toggleWindow);
  tray.on('right-click', () => {
    if (constants.DEBUG) { window.webContents.openDevTools() }
  });
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
      // Prevents renderer process code from not running when window is hidden
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

function update() {
  let stats = new Stats(constants.API_KEY, constants.FIAT, constants.AUTO_EXCHANGE);
  if (constants.DEBUG) console.log('update : stats=', JSON.stringify(stats));

  let coin = _.find(coins, (coin) => { return coin.code === constants.AUTO_EXCHANGE });
  if (constants.DEBUG) console.log('update : coin=', JSON.stringify(coin));

  stats.getDashboard(coin.name).then( (dashboard) => {
    if (constants.DEBUG) console.log('update : dashboard =', JSON.stringify(dashboard));

    let data = dashboard.getdashboarddata.data;
    let balance = Number(data.balance.confirmed).toFixed(4);

    tray.setTitle(balance + " " + coin.code);
    window.webContents.send('dashboard-loaded', coin, data);

    return stats.getUserBalances();

  }).then( (balances) => {
    if (constants.DEBUG) console.log('update : balances =', JSON.stringify(balances));

    let data = _.chain(balances.getuserallbalances.data)
      .map((balance) => {
        balance.coin = _.find(coins, (coin) => {
          return balance.coin === coin.name;
        });
        return balance;
      })
      .sortBy((balance) => {
        return balance.coin.code
      })
      .sortBy((balance) => {
        return balance.coin.code !== constants.AUTO_EXCHANGE
      })
      .value();

    window.webContents.send('balances-loaded', data);

  }).then( () => {

    window.webContents.send('update-complete');

  }).catch( (error) => {
    window.webContents.send("on-error", { error: error });
    if (constants.DEBUG) console.error(error);
  });
}

ipcMain.on('update', (event) => {
  if (constants.DEBUG) console.log('on update');
  update();
});
