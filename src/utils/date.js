/**
 * Date utility functions
 */
import {logger} from "../core/error-handler";

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

  let year, month, day;

  try {
    const yyyyMMdd = /^\d{8}$/;
    if (yyyyMMdd.test(dateString)) {
      year = parseInt(dateString.substring(0, 4), 10);
      month = parseInt(dateString.substring(4, 6), 10);
      day = parseInt(dateString.substring(6, 8), 10);
    } else {
      const parts = dateString.replace(/[./]/g, '-').split('-');

      if (parts.length !== 3) {
        logger.warn(`Invalid date format (unparseable): ${dateString}`);
        return null;
      }

      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }

    if (year < 100) {
      year += 2000;
    }

    if (isNaN(year) || isNaN(month) || isNaN(day) ||
        month < 1 || month > 12 || day < 1 || day > 31) {
      logger.warn(`Invalid date components: ${dateString}`);
      return null;
    }

    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day) {
      logger.warn(`Invalid date (e.g., Feb 30th): ${dateString}`);
      return null;
    }

    return date;

  } catch (error) {
    logger.error(`Failed to parse date: ${dateString}`, error);
    return null;
  }
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
  // If already a Date object, return it
  if (dateString instanceof Date) {
    return dateString;
  }

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