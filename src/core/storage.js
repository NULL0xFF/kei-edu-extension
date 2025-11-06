/**
 * IndexedDB storage management
 */

import {DB_CONFIG} from '../config/settings.js';
import {ErrorHandler, logger} from './error-handler.js';

export class Storage {
  constructor() {
    this.db = null;
    this.dbName = DB_CONFIG.name;
    this.dbVersion = DB_CONFIG.version;
  }

  async init() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(ErrorHandler.storageError('Failed to open database', {
          error: request.error
        }));
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('Database initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        Object.entries(DB_CONFIG.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: config.keyPath,
              autoIncrement: config.autoIncrement
            });
            logger.debug(`Created object store: ${storeName}`);
          }
        });
      };
    });
  }

  async add(storeName, key, value) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise((resolve, reject) => {
        const request = store.add({id: key, value});
        request.onsuccess = () => {
          logger.debug(`Data added to ${storeName}: ${key}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to add data to ${storeName}`, {
        key,
        error
      });
    }
  }

  async get(storeName, key) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result ? request.result.value : null;
          logger.debug(`Data retrieved from ${storeName}: ${key}`,
              result !== null);
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to get data from ${storeName}`, {
        key,
        error
      });
    }
  }

  async update(storeName, key, value) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise((resolve, reject) => {
        const request = store.put({id: key, value});
        request.onsuccess = () => {
          logger.debug(`Data updated in ${storeName}: ${key}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to update data in ${storeName}`, {
        key,
        error
      });
    }
  }

  async delete(storeName, key) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise((resolve, reject) => {
        const request = store.delete(key);
        request.onsuccess = () => {
          logger.debug(`Data deleted from ${storeName}: ${key}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to delete data from ${storeName}`,
          {
            key,
            error
          });
    }
  }

  async exists(storeName, key) {
    try {
      const data = await this.get(storeName, key);
      return data !== null;
    } catch (error) {
      logger.warn(`Failed to check existence in ${storeName}: ${key}`, error);
      return false;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database closed');
    }
  }
}

export const storage = new Storage();
