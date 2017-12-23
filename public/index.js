"use strict";

const {ipcRenderer, shell} = require('electron');

document.addEventListener('click', (event) => {
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

// Refresh every 10 minutes
const interval = 10 * 60 * 1000;
setInterval(update, interval);

function init() {
  update();
}

function update() {
  ipcRenderer.send("mph-stats-updated", { success: true });
  updateView();
}

const updateView = () => {
  document.querySelector('.js-summary').textContent = 'Hello, World!';
};

// Update when loaded
document.addEventListener('DOMContentLoaded', init);