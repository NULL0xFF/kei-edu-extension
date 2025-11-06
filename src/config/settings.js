/**
 * Application settings
 */

export const DB_CONFIG = {
  name: 'kei-edu-extension',
  version: 2,
  stores: {
    data: {
      keyPath: 'id',
      autoIncrement: false
    }
  }
};

export const LOGGING = {
  enabled: true,
  level: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
  },
  currentLevel: 2
};
