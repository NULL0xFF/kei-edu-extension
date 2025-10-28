/**
 * @file storage.js
 * @description IndexedDB 스토리지 관리
 */

import { DB_CONFIG } from '../config/settings.js';
import { ErrorHandler, logger } from './error-handler.js';

/**
 * 스토리지 관리 클래스
 */
export class Storage {
  constructor() {
    this.db = null;
    this.dbName = DB_CONFIG.name;
    this.dbVersion = DB_CONFIG.version;
  }

  /**
   * 데이터베이스 초기화
   * @returns {Promise<IDBDatabase>}
   */
  async init() {
    if (this.db) {
      return this.db;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(ErrorHandler.storageError('Failed to open database', {
          error: request.error,
        }));
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('Database initialized successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create object stores
        Object.entries(DB_CONFIG.stores).forEach(([storeName, config]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, {
              keyPath: config.keyPath,
              autoIncrement: config.autoIncrement,
            });
            logger.debug(`Created object store: ${storeName}`);
          }
        });
      };
    });
  }

  /**
   * 데이터 추가
   * @param {string} storeName - 스토어 이름
   * @param {string} key - 키
   * @param {*} value - 값
   * @returns {Promise<void>}
   */
  async add(storeName, key, value) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await new Promise((resolve, reject) => {
        const request = store.add({ id: key, value });
        request.onsuccess = () => {
          logger.debug(`Data added to ${storeName}: ${key}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to add data to ${storeName}`, {
        key,
        error,
      });
    }
  }

  /**
   * 데이터 조회
   * @param {string} storeName - 스토어 이름
   * @param {string} key - 키
   * @returns {Promise<*>} 데이터
   */
  async get(storeName, key) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      return new Promise((resolve, reject) => {
        const request = store.get(key);
        request.onsuccess = () => {
          const result = request.result ? request.result.value : null;
          logger.debug(`Data retrieved from ${storeName}: ${key}`, result !== null);
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to get data from ${storeName}`, {
        key,
        error,
      });
    }
  }

  /**
   * 데이터 업데이트
   * @param {string} storeName - 스토어 이름
   * @param {string} key - 키
   * @param {*} value - 값
   * @returns {Promise<void>}
   */
  async update(storeName, key, value) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise((resolve, reject) => {
        const request = store.put({ id: key, value });
        request.onsuccess = () => {
          logger.debug(`Data updated in ${storeName}: ${key}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to update data in ${storeName}`, {
        key,
        error,
      });
    }
  }

  /**
   * 데이터 삭제
   * @param {string} storeName - 스토어 이름
   * @param {string} key - 키
   * @returns {Promise<void>}
   */
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
      throw ErrorHandler.storageError(`Failed to delete data from ${storeName}`, {
        key,
        error,
      });
    }
  }

  /**
   * 데이터 존재 여부 확인
   * @param {string} storeName - 스토어 이름
   * @param {string} key - 키
   * @returns {Promise<boolean>}
   */
  async exists(storeName, key) {
    try {
      const data = await this.get(storeName, key);
      return data !== null;
    } catch (error) {
      logger.warn(`Failed to check existence in ${storeName}: ${key}`, error);
      return false;
    }
  }

  /**
   * 모든 키 조회
   * @param {string} storeName - 스토어 이름
   * @returns {Promise<string[]>}
   */
  async getAllKeys(storeName) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      return new Promise((resolve, reject) => {
        const request = store.getAllKeys();
        request.onsuccess = () => {
          logger.debug(`All keys retrieved from ${storeName}`, request.result.length);
          resolve(request.result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to get all keys from ${storeName}`, {
        error,
      });
    }
  }

  /**
   * 스토어 초기화
   * @param {string} storeName - 스토어 이름
   * @returns {Promise<void>}
   */
  async clear(storeName) {
    try {
      await this.init();
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => {
          logger.info(`Store cleared: ${storeName}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      throw ErrorHandler.storageError(`Failed to clear store ${storeName}`, {
        error,
      });
    }
  }

  /**
   * 데이터베이스 닫기
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database closed');
    }
  }
}

// 싱글톤 인스턴스
export const storage = new Storage();
