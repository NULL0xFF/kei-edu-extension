/**
 * @file storage.js
 * @description This file contains the functions to interact with the IndexedDB database.
 */

/**
 * Initialize the IndexedDB database.
 * @returns {Promise<IDBDatabase>} The IndexedDB database
 * @async
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MyDB', 1);
    request.onerror = reject;
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('data', {keyPath: 'id'});
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
  console.debug(`Adding data to IndexedDB with ID: ${id}`);
  // console.debug(`Data: ${JSON.stringify(value)}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readwrite');
  const store = transaction.objectStore('data');
  await store.add({id, value});
  console.debug(`Successfully added data with ID: ${id}`);
}

/**
 * Retrieve data from the IndexedDB database.
 * @param {string} id The ID of the data
 * @returns {Promise<Object>} The data
 * @async
 */
async function getData(id) {
  console.debug(`Retrieving data from IndexedDB with ID: ${id}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readonly');
  const store = transaction.objectStore('data');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = reject;
    request.onsuccess = () => resolve(
        request.result ? request.result.value : null);
  });
}

/**
 * Update data in the IndexedDB database.
 * @param {string} id The ID of the data
 * @param {Array<Object>} value The new data to update
 * @async
 */
async function updateData(id, value) {
  console.debug(`Updating data in IndexedDB with ID: ${id}`);
  // console.debug(`New data: ${JSON.stringify(value)}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readwrite');
  const store = transaction.objectStore('data');
  const data = {id, value};
  await store.put(data);
  console.debug(`Successfully updated data with ID: ${id}`);
}

/**
 * Delete data from the IndexedDB database.
 * @param {string} id The ID of the data
 * @async
 */
async function deleteData(id) {
  console.debug(`Deleting data from IndexedDB with ID: ${id}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readwrite');
  const store = transaction.objectStore('data');
  await store.delete(id);
  console.debug(`Successfully deleted data with ID: ${id}`);
}

/**
 * Check if data exists in the IndexedDB database.
 * @param {string} id The ID of the data
 * @returns {Promise<boolean>} Whether the data exists
 * @async
 */
async function isExist(id) {
  console.debug(`Checking if data exists in IndexedDB with ID: ${id}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readonly');
  const store = transaction.objectStore('data');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = reject;
    request.onsuccess = () => resolve(!!request.result);
  });
}