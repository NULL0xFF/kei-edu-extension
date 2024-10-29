// src/scripts/storage.js

// Initialize the IndexedDB database
export async function initDB() {
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

// Add data to the IndexedDB database
export async function addData(id, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    const request = store.add({id, value});
    request.onsuccess = resolve;
    request.onerror = reject;
  });
}

// Retrieve data from the IndexedDB database
export async function getData(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    const request = store.get(id);
    request.onsuccess = () => resolve(
        request.result ? request.result.value : null);
    request.onerror = reject;
  });
}

// Update data in the IndexedDB database
export async function updateData(id, value) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    const request = store.put({id, value});
    request.onsuccess = resolve;
    request.onerror = reject;
  });
}

// Delete data from the IndexedDB database
export async function deleteData(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['data'], 'readwrite');
    const store = transaction.objectStore('data');
    const request = store.delete(id);
    request.onsuccess = resolve;
    request.onerror = reject;
  });
}

// Check if data exists in the IndexedDB database
export async function isExist(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['data'], 'readonly');
    const store = transaction.objectStore('data');
    const request = store.get(id);
    request.onsuccess = () => resolve(!!request.result);
    request.onerror = reject;
  });
}
