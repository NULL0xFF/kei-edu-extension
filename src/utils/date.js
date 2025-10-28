/**
 * @file date.js
 * @description 날짜 관련 유틸리티 함수
 */

/**
 * Date를 로컬 ISO 형식으로 변환
 * @param {Date} date - 변환할 날짜
 * @returns {string} ISO 형식 문자열
 */
export function toLocalISOString(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, -1);
}

/**
 * 파일명에 사용할 타임스탬프 생성
 * @param {Date} date - 날짜 객체
 * @returns {string} 타임스탬프 문자열 (YYYY-MM-DD_HHmmss)
 */
export function getFileTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}${minutes}${seconds}`;
}

/**
 * 날짜 문자열을 Date 객체로 변환
 * @param {string} dateString - 날짜 문자열 (YYYY-MM-DD)
 * @returns {Date}
 */
export function parseDate(dateString) {
  if (!dateString) {
    return null;
  }
  
  const parts = dateString.split(/[-/]/);
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  
  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 * @param {Date} date - 날짜 객체
 * @returns {string}
 */
export function formatDate(date) {
  if (!(date instanceof Date)) {
    return '';
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 두 날짜가 같은 날인지 확인
 * @param {Date} date1 - 첫 번째 날짜
 * @param {Date} date2 - 두 번째 날짜
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * 날짜가 범위 내에 있는지 확인
 * @param {Date} date - 확인할 날짜
 * @param {Date} startDate - 시작 날짜
 * @param {Date} endDate - 종료 날짜
 * @returns {boolean}
 */
export function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

/**
 * UTC 날짜를 로컬 날짜로 변환
 * @param {string} utcString - UTC 날짜 문자열
 * @returns {Date}
 */
export function utcToLocal(utcString) {
  const utcDate = new Date(utcString);
  const offset = utcDate.getTimezoneOffset();
  return new Date(utcDate.getTime() - offset * 60000);
}

/**
 * 로컬 날짜를 UTC로 변환
 * @param {Date} localDate - 로컬 날짜
 * @returns {Date}
 */
export function localToUtc(localDate) {
  const offset = localDate.getTimezoneOffset();
  return new Date(localDate.getTime() + offset * 60000);
}
