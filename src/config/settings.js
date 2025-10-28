/**
 * @file settings.js
 * @description 애플리케이션 설정
 */

/**
 * IndexedDB 설정
 */
export const DB_CONFIG = {
  name: 'kei-edu-extension',
  version: 2,
  stores: {
    data: {
      keyPath: 'id',
      autoIncrement: false,
    },
    metadata: {
      keyPath: 'key',
      autoIncrement: false,
    },
  },
};

/**
 * 로깅 설정
 */
export const LOGGING = {
  enabled: true,
  level: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
  },
  currentLevel: 2, // INFO
};

/**
 * 기능 플래그
 */
export const FEATURES = {
  autoRefresh: true,
  exportCSV: true,
  exportXLSX: true,
  progressIndicator: true,
  errorNotification: true,
};

/**
 * 성능 설정
 */
export const PERFORMANCE = {
  batchSize: 100,
  debounceDelay: 300,
  cacheExpiry: 3600000, // 1 hour in ms
};
