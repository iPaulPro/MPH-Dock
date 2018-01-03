"use strict";

const constants = require('./constants');

const KEY_API_KEY = 'api-key'
  , KEY_AUTO_EXCHANGE = 'auto-exchange'
  , KEY_REFRESH_INTERVAL = 'refresh-interval';

class Settings {

  constructor(settings) {
    this.settings = settings;
  }

  getApiKey() {
    return this.settings.get(KEY_API_KEY) || constants.API_KEY;
  }

  getAutoExchange() {
    return this.settings.get(KEY_AUTO_EXCHANGE) || constants.AUTO_EXCHANGE;
  }

  getRefreshInterval() {
    return this.settings.get(KEY_REFRESH_INTERVAL) || constants.REFRESH_INTERVAL;
  }

  setApiKey(apiKey) {
    this.settings.set(KEY_API_KEY, apiKey);
  }

  setAutoExchange(autoExchange) {
    this.settings.set(KEY_AUTO_EXCHANGE, autoExchange);
  }

  setRefreshInterval(interval) {
    this.settings.set(KEY_REFRESH_INTERVAL, interval);
  }

}

module.exports = Settings;