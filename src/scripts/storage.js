import Logger from './logger.js';

const logger = new Logger('storage');

/**
 * IndexedDB 데이터베이스 초기화
 * @returns {Promise<IDBDatabase>} IndexedDB 데이터베이스 객체
 * @async
 */
async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kei-edu-extension', 1);
    request.onerror = reject;
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore('data', {keyPath: 'id'});
    };
    logger.debug('Initialized IndexedDB database');
  });
}

/**
 * IndexedDB에 데이터 추가
 * @param id
 * @param value
 * @returns {Promise<void>}
 */
async function addData(id, value) {
  logger.debug(`Adding data to IndexedDB with ID: ${id}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readwrite');
  const store = transaction.objectStore('data');
  store.add({id, value});
  logger.debug(`Successfully added data with ID: ${id}`);
}

/**
 * IndexedDB에서 데이터 조회
 * @param {string} id 데이터 ID
 * @returns {Promise<Object>} 조회된 데이터
 * @async
 */
async function getData(id) {
  logger.debug(`Retrieving data from IndexedDB with ID: ${id}`);
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
 * IndexedDB 데이터 업데이트
 * @param {string} id 데이터 ID
 * @param {Array<Object>} value 업데이트할 데이터
 * @async
 */
async function updateData(id, value) {
  logger.debug(`Updating data in IndexedDB with ID: ${id}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readwrite');
  const store = transaction.objectStore('data');
  const data = {id, value};
  store.put(data);
  logger.debug(`Successfully updated data with ID: ${id}`);
}

/**
 * IndexedDB에서 데이터 삭제
 * @param {string} id 데이터 ID
 * @async
 */
async function deleteData(id) {
  logger.debug(`Deleting data from IndexedDB with ID: ${id}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readwrite');
  const store = transaction.objectStore('data');
  store.delete(id);
  logger.debug(`Successfully deleted data with ID: ${id}`);
}

/**
 * IndexedDB에 데이터 존재 여부 확인
 * @param {string} id 데이터 ID
 * @returns {Promise<boolean>} 존재 여부
 * @async
 */
async function isExist(id) {
  logger.debug(`Checking if data exists in IndexedDB with ID: ${id}`);
  const db = await initDB();
  const transaction = db.transaction(['data'], 'readonly');
  const store = transaction.objectStore('data');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onerror = reject;
    request.onsuccess = () => resolve(!!request.result);
  });
}

export {
  addData,
  getData,
  updateData,
  deleteData,
  isExist
}