"use strict";

const config = require('../config');

const KEY_API_KEY = 'api-key'
  , KEY_AUTO_EXCHANGE = 'auto-exchange'
  , KEY_REFRESH_INTERVAL = 'refresh-interval'
  , KEY_SHOW_WEEK_AVERAGE = 'show-week-average';

class Settings {

  constructor(settings) {
    this.settings = settings;
  }

  getApiKey() {
    return this.settings.get(KEY_API_KEY) || config.API_KEY;
  }

  getAutoExchange() {
    return this.settings.get(KEY_AUTO_EXCHANGE) || config.AUTO_EXCHANGE;
  }

  getRefreshInterval() {
    return this.settings.get(KEY_REFRESH_INTERVAL) || config.REFRESH_INTERVAL;
  }

  getShowWeekAverage() {
    return this.settings.get(KEY_SHOW_WEEK_AVERAGE) || false;
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

  setShowWeekAverage(showWeekAvg) {
    this.settings.set(KEY_SHOW_WEEK_AVERAGE, showWeekAvg);
  }

  toJSON() {
    return {
      apiKey: this.getApiKey(),
      autoExchange: this.getAutoExchange(),
      refreshInterval: this.getRefreshInterval(),
      showWeekAverage: this.getShowWeekAverage()
    }

  }

}

module.exports = Settings;