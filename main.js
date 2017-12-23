const {app, BrowserWindow, ipcMain, Tray} = require('electron');
const path = require('path');
const AutoLaunch = require('auto-launch');

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
  console.log('ready');
  createTray();
  createWindow();
});

// Quit the app when the window is closed
app.on('window-all-closed', () => {
  app.quit();
});

const createTray = () => {
  tray = new Tray(path.join(assetsDirectory, 'ic_poll.png'));
  tray.on('right-click', toggleWindow);
  tray.on('double-click', toggleWindow);
  tray.on('click', toggleWindow);
};

const getWindowPosition = () => {
  const windowBounds = window.getBounds();
  const trayBounds = tray.getBounds();

  // Center window horizontally below the tray icon
  const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));

  // Position window 4 pixels vertically below the tray icon
  const y = Math.round(trayBounds.y + trayBounds.height + 4);

  return {x: x, y: y};
};

const createWindow = () => {
  window = new BrowserWindow({
    width: 300,
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
};

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
};

const showWindow = () => {
  const position = getWindowPosition();
  window.setPosition(position.x, position.y, false);
  window.show();
  window.focus();
};

ipcMain.on('show-window', () => {
  showWindow();
});

ipcMain.on('mph-stats-updated', (event, success) => {
  // Update icon and title in tray
  tray.setTitle(`$10.00`);
  tray.setImage(path.join(assetsDirectory, 'ic_poll.png'));
});
