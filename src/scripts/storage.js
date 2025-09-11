/**
 * @file storage.js
 * @description This file contains the functions to interact with the IndexedDB database.
 */

import { createLogger } from './shared.js';

// Create logger for storage component
const logger = createLogger('STORAGE');

/**
 * Initialize the IndexedDB database.
 * @returns {Promise<IDBDatabase>} The IndexedDB database
 * @async
 */
async function initDB() {
  logger.debug('Initializing IndexedDB database');

  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyDB', 1);

    request.onerror = (event) => {
      logger.error('Failed to open IndexedDB database', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      logger.debug('Successfully opened IndexedDB database');
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      logger.info('Upgrading IndexedDB database schema');
      const db = event.target.result;
      db.createObjectStore('data', { keyPath: 'id' });
      logger.debug('Created object store: data');
    };
  });
}

/**
 * Add data to the IndexedDB database.
 * @param {string} id The ID of the data
 * @param {Array<Object>} data The data to add
 * @async
 */
async function addData(id, value) {
  logger.debug(`Adding data to IndexedDB with ID: ${id}`);

  try {
    const db = await initDB();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    await store.add({ id, value });
    logger.info(`Successfully added data with ID: ${id}`);
  } catch (error) {
    logger.error(`Failed to add data with ID: ${id}`, error);
    throw error;
  }
}

/**
 * Retrieve data from the IndexedDB database.
 * @param {string} id The ID of the data
 * @returns {Promise<Object>} The data
 * @async
 */
async function getData(id) {
  logger.debug(`Retrieving data from IndexedDB with ID: ${id}`);

  try {
    const db = await initDB();
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onerror = (event) => {
        logger.error(`Failed to retrieve data with ID: ${id}`, event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        const result = event.target.result ? event.target.result.value : null;
        if (result) {
          logger.debug(`Successfully retrieved data with ID: ${id}`);
        } else {
          logger.warn(`No data found with ID: ${id}`);
        }
        resolve(result);
      };
    });
  } catch (error) {
    logger.error(`Error during data retrieval for ID: ${id}`, error);
    throw error;
  }
}

/**
 * Update data in the IndexedDB database.
 * @param {string} id The ID of the data
 * @param {Array<Object>} value The new data to update
 * @async
 */
async function updateData(id, value) {
  logger.debug(`Updating data in IndexedDB with ID: ${id}`);

  try {
    const db = await initDB();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    const data = { id, value };
    await store.put(data);
    logger.info(`Successfully updated data with ID: ${id}`);
  } catch (error) {
    logger.error(`Failed to update data with ID: ${id}`, error);
    throw error;
  }
}

/**
 * Delete data from the IndexedDB database.
 * @param {string} id The ID of the data
 * @async
 */
async function deleteData(id) {
  logger.debug(`Deleting data from IndexedDB with ID: ${id}`);

  try {
    const db = await initDB();
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    await store.delete(id);
    logger.info(`Successfully deleted data with ID: ${id}`);
  } catch (error) {
    logger.error(`Failed to delete data with ID: ${id}`, error);
    throw error;
  }
}

/**
 * Check if data exists in the IndexedDB database.
 * @param {string} id The ID of the data
 * @returns {Promise<boolean>} Whether the data exists
 * @async
 */
async function isExist(id) {
  logger.debug(`Checking if data exists in IndexedDB with ID: ${id}`);

  try {
    const db = await initDB();
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');

    return new Promise((resolve, reject) => {
      const request = store.get(id);

      request.onerror = (event) => {
        logger.error(`Failed to check existence for ID: ${id}`, event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        const exists = !!event.target.result;
        logger.debug(`Data with ID: ${id} ${exists ? 'exists' : 'does not exist'}`);
        resolve(exists);
      };
    });
  } catch (error) {
    logger.error(`Error during existence check for ID: ${id}`, error);
    throw error;
  }
}

export { addData, getData, updateData, deleteData, isExist };