"use strict";

const fs = require('fs');
if (fs.existsSync('.env')) require('dotenv').config();

const electron = require('electron');
const {app, BrowserWindow, ipcMain, Menu, Tray} = require('electron');

const _ = require('underscore')
  , path = require('path')
  , ejs = require('ejs')
  , AutoLaunch = require('auto-launch')
  , electronSettings = require('electron-settings')
  , Settings = require('./app/data/settings')
  , Stats = require('./app/data/stats')
  , coins = require('./app/assets/coins.json')
  , config = require('./app/config');

let tray = undefined;
let window = undefined;
let settings = new Settings(electronSettings);

let init = () => {
  // AutoLaunch is used to ensure that the app is started with OS login.
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

  if (app.dock) {
    // Don't show the app in the dock
    app.dock.hide();
  }
};

init();

/**
 * Calculates the window position, centering it under the Tray icon.
 *
 * @param trayBounds The bounds of the Tray that was clicked
 * @return {{x: number, y: number}} The window coordinates
 */
const getWindowPosition = (trayBounds) => {
  const windowBounds = window.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return { x: x, y: y };
};

/**
 * Reveals and focuses on the window
 * @param trayBounds The bounds of the Tray that was clicked
 */
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

/**
 * Creates the menu Tray and assigns necessary click handlers
 */
const createTray = () => {
  let assetsDirectory = path.join(__dirname, 'app', 'assets');

  tray = new Tray(path.join(assetsDirectory, 'iconTemplate.png'));
  tray.on('click', toggleWindow);
  tray.on('right-click', (event, bounds) => {
    let template = [
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ];
    tray.popUpContextMenu(Menu.buildFromTemplate(template));
  });

  if (config.DEBUG) {
    tray.on('double-click', () => {
      window.webContents.openDevTools();
    });
  }
};

/**
 * Creates the main window
 */
const createWindow = () => {
  window = new BrowserWindow({
    width: 376,
    height: 496,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: true,
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
    tray.setHighlightMode('always');
  });

  window.on('hide', () => {
    tray.setHighlightMode('never');
  });

  // Create the Application's main menu, enabling copy/paste/quit key bindings
  let template = [{
    label: "Application",
    submenu: [
      { label: "MPH Dock", selector: "orderFrontStandardAboutPanel:" },
      { type: "separator" },
      { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ]}, {
    label: "Edit",
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]}
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
};

// Called when the application is started
app.on('ready', () => {
  if (config.DEBUG) console.log('ready : coins = %s, config = %s', JSON.stringify(coins), JSON.stringify(config));

  createTray();
  createWindow();
});

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.quit();
});

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', () => {
  if (window === null) {
    createWindow();
  }
});

/**
 * Loads coins and settings for the setup screen, and sends a message to the renderer process to show setup
 */
let setup = () => {
  let data = {
    coins: coins,
    apiKey: settings.getApiKey(),
    autoExchange: settings.getAutoExchange(),
    refreshInterval: settings.getRefreshInterval(),
    version: app.getVersion()
  };
  window.webContents.send('setup-loaded', data);
};

let onError = function (error) {
  if (config.DEBUG) console.error("update : ", error);
  window.webContents.send("on-error", {error: error});
};

/**
 * Loads
 *
 * @param dashboard
 * @param coin
 */
let loadDashboard = (dashboard, coin) => {
  if (config.DEBUG) console.log('update : dashboard =', JSON.stringify(dashboard));

  let data = dashboard.getdashboarddata.data;
  if (data.error) {
    return onError(data.error);
  }

  let balance = Number(data.balance.confirmed).toFixed(4);

  let credits = data.recent_credits;
  let total = 0;
  for (let credit of credits) {
    total += credit.amount;
  }
  data.creditAvg = total / credits.length;

  let showWeekAverage = settings.getShowWeekAverage();

  tray.setTitle(balance + " " + coin.code);
  window.webContents.send('dashboard-loaded', coin, data, showWeekAverage);
};

let addCoinToBalance = (balance) => {
  balance.coin = _.find(coins, (coin) => {
    return balance.coin === coin.name;
  });

  const maxDigits = 8;
  balance.confirmed = balance.confirmed === 0 ? balance.confirmed : Number(balance.confirmed).toFixed(maxDigits);
  balance.unconfirmed = balance.unconfirmed === 0 ? balance.unconfirmed : Number(balance.unconfirmed).toFixed(maxDigits);
  balance.ae_confirmed = balance.ae_confirmed === 0 ? balance.ae_confirmed : Number(balance.ae_confirmed).toFixed(maxDigits);
  balance.ae_unconfirmed = balance.ae_unconfirmed === 0 ? balance.ae_unconfirmed : Number(balance.ae_unconfirmed).toFixed(maxDigits);
  balance.exchange = balance.exchange === 0 ? balance.exchange : Number(balance.exchange).toFixed(maxDigits);

  return balance;
};

let loadBalances = (balances) => {
  if (config.DEBUG) console.log('update : balances =', JSON.stringify(balances));

  let data = balances.getuserallbalances.data;
  if (data.error) {
    return onError(data.error);
  }

  try {
    data = _.chain(balances.getuserallbalances.data)
      .map(addCoinToBalance)
      .sortBy((balance) => {
        return balance.coin.code;
      })
      .value();
  } catch (e) {
    return onError(e);
  }

  window.webContents.send('balances-loaded', data);
};

let update = () => {
  let apiKey = settings.getApiKey();
  let autoExchange = settings.getAutoExchange();

  if (apiKey) {
    window.webContents.send('settings-loaded', settings.toJSON());
  } else {
    return setup();
  }

  const stats = new Stats(apiKey, config.FIAT, autoExchange);
  if (config.DEBUG) console.log('update : stats=', JSON.stringify(stats));

  const coin = _.find(coins, (coin) => {
    return coin.code === autoExchange;
  });
  if (config.DEBUG) console.log('update : coin=', JSON.stringify(coin));

  stats.getDashboard(coin)
    .then((dashboard) => {
      loadDashboard(dashboard, coin);
      return stats.getUserBalances();
    })
    .then(loadBalances)
    .then(() => {
      window.webContents.send('update-complete');
    })
    .catch((error) => {
      onError(error);
    }
  );
};

// Triggered by renderer process when the setup screen should be shown
ipcMain.on('setup', (event) => {
  if (config.DEBUG) console.log('on setup', JSON.stringify(new Date()));
  setup();
});

// Triggered by renderer process when values are submitted from the setup form
ipcMain.on('save-setup', (event, apiKey, autoExchange, refreshInterval) => {
  if (config.DEBUG) console.log('on save-setup : apiKey = %s, autoExchange = %s, refresh = %s', apiKey, autoExchange, refreshInterval);
  settings.setApiKey(apiKey);
  settings.setAutoExchange(autoExchange);
  settings.setRefreshInterval(refreshInterval);

  update();
});

// Triggered by renderer process when an update is requested
ipcMain.on('update', (event) => {
  if (config.DEBUG) console.log('on update', JSON.stringify(new Date()));
  update();
});

// Triggered by renderer process when the user toggles the balance summary view
ipcMain.on('toggle-average', (event) => {
  if (config.DEBUG) console.log('on toggle-average', JSON.stringify(new Date()));
  let showWeekAverage = settings.getShowWeekAverage();
  settings.setShowWeekAverage(!showWeekAverage);

  update();
});

