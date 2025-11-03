/**
 * Date utility functions
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

export function parseDate(dateString) {
  if (!dateString) {
    return null;
  }

  // If already a Date object, return it
  if (dateString instanceof Date) {
    return dateString;
  }
  
  const parts = dateString.split(/[-/]/);
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${dateString}`);
  }

  const [year, month, day] = parts.map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date, separator = '-') {
  if (!(date instanceof Date) || isNaN(date)) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${separator}${month}${separator}${day}`;
}

export function formatCompletionDate(dateString) {
  if (!dateString || dateString.length !== 14) {
    return null;
  }

  // Parse yyyyMMddHHmmss format
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  const hour = dateString.substring(8, 10);
  const minute = dateString.substring(10, 12);
  const second = dateString.substring(12, 14);

  // Create UTC date and adjust for timezone
  const timezoneOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(
      Date.UTC(year, month - 1, day, hour, minute, second) + timezoneOffset
  );
}

export function isDateInRange(date, startDate, endDate) {
  return date >= startDate && date <= endDate;
}

export function toLocalISOString(date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 19).replace('T', ' ');
}
