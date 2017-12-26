"use strict";

const fs = require('fs');
if (fs.existsSync('.env')) require('dotenv').config();

const electron = require('electron');
const {app, BrowserWindow, ipcMain, Tray} = require('electron');

const _ = require('underscore')
  , path = require('path')
  , ejs = require('ejs')
  , AutoLaunch = require('auto-launch')
  , coins = require('./app/coins.json')
  , constants = require('./app/constants');

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

const assetsDirectory = path.join(__dirname, 'assets');

let tray = undefined;
let window = undefined;

// Don't show the app in the dock
app.dock.hide();

app.on('ready', () => {
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

  window.loadURL(`file://${path.join(__dirname, 'public/index.html')}`);

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

ipcMain.on('mph-stats-updated', (event, result) => {
  let dashboard = result.dashboard;
  let balance = Number(dashboard.balance.confirmed).toFixed(4);
  let coin = result.coin;
  tray.setTitle(balance + " " + coin.code);
});

ipcMain.on('error', (event, error) => {

});
