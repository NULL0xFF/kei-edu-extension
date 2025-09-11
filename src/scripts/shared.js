/**
 * @file shared.js
 * @description Enhanced shared utilities with logging system and helper functions
 */

/**
 * Logging levels enumeration
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * Logger class for consistent logging throughout the application
 * Format: [TIMESTAMP] [COMPONENT] [CALLER] Message
 */
class Logger {
  constructor(component = 'SYSTEM') {
    this.component = component;
    this.logLevel = LogLevel.DEBUG; // Default to DEBUG for development
  }

  /**
   * Format timestamp for logging
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  /**
   * Get the name of the calling function
   * @returns {string} Caller function name
   */
  getCaller() {
    try {
      const stack = new Error().stack;
      if (!stack) return 'unknown';

      const lines = stack.split('\n');
      // Skip first line (Error message), this function, and the log method
      // Look for the first line that's not from this Logger class
      for (let i = 3; i < lines.length; i++) {
        const line = lines[i];
        if (line && !line.includes('Logger.') && !line.includes('log')) {
          // Extract function name from stack trace
          // Handle different formats: "at functionName" or "functionName@"
          let match = line.match(/at\s+([^\s(]+)/);
          if (!match) {
            match = line.match(/([^@]+)@/);
          }
          if (match && match[1]) {
            let funcName = match[1];
            // Clean up the function name
            if (funcName.includes('.')) {
              funcName = funcName.split('.').pop();
            }
            if (funcName === '<anonymous>' || funcName === 'anonymous') {
              return 'anonymous';
            }
            return funcName;
          }
        }
      }
      return 'unknown';
    } catch (e) {
      return 'unknown';
    }
  }

  /**
   * Check if log level should be output
   * @param {string} level - Log level to check
   * @returns {boolean} Whether to output the log
   */
  shouldLog(level) {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentIndex = levels.indexOf(this.logLevel);
    const messageIndex = levels.indexOf(level);
    return messageIndex >= currentIndex;
  }

  /**
   * Format and output log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  log(level, message, ...args) {
    if (!this.shouldLog(level)) return;

    const timestamp = this.getTimestamp();
    const caller = this.getCaller();
    const formattedMessage = `[${timestamp}] [${this.component}] [${caller}] ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, ...args);
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args);
        break;
      default:
        console.log(formattedMessage, ...args);
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {...any} args - Additional arguments
   */
  debug(message, ...args) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {...any} args - Additional arguments
   */
  info(message, ...args) {
    this.log(LogLevel.INFO, message, ...args);
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {...any} args - Additional arguments
   */
  warn(message, ...args) {
    this.log(LogLevel.WARN, message, ...args);
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {...any} args - Additional arguments
   */
  error(message, ...args) {
    this.log(LogLevel.ERROR, message, ...args);
  }

  /**
   * Set logging level
   * @param {string} level - New logging level
   */
  setLevel(level) {
    if (Object.values(LogLevel).includes(level)) {
      this.logLevel = level;
    } else {
      this.warn(`Invalid log level: ${level}. Using DEBUG as default.`);
    }
  }

  /**
   * Create a child logger with a specific component name
   * @param {string} component - Component name
   * @returns {Logger} New logger instance
   */
  child(component) {
    const childLogger = new Logger(component);
    childLogger.setLevel(this.logLevel);
    return childLogger;
  }
}

/**
 * Global logger instance
 */
const logger = new Logger('SHARED');

/**
 * Create logger for specific component
 * @param {string} component - Component name
 * @returns {Logger} Logger instance for the component
 */
function createLogger(component) {
  return logger.child(component);
}

/**
 * Get the CSRF token from the meta tag.
 * @function getCSRFToken
 * @returns {string} - The CSRF token.
 */
export function getCSRFToken() {
  const token = document.querySelector('meta[name="_csrf"]')?.getAttribute('content');
  if (!token) {
    logger.warn('CSRF token not found in meta tag');
  }
  return token;
}

/**
 * Tokenizes the given text by splitting it by comma and trimming each element.
 * @function tokenize
 * @param {string} text - The text to tokenize.
 * @returns {Array} - The tokenized array.
 */
function tokenize(text = '') {
  logger.debug(`Tokenizing text: "${text}"`);
  const tokens = text.replace(/\r/g, "").split(",").map(element => element.trim());
  logger.debug(`Tokenization result: ${tokens.length} tokens`);
  return tokens;
}

/**
 * Table the first and last entries of the given data.
 * @function customTable
 * @param {Array} data - The data to display.
 * @param {number} first - The number of entries to display from the start.
 * @param {number} last - The number of entries to display from the end.
 */
function customTable(data, first = 10, last = 10) {
  const tableLogger = createLogger('TABLE');

  if (!Array.isArray(data)) {
    tableLogger.error('The data provided is not an array.');
    return;
  }

  const totalLength = data.length;
  tableLogger.debug(`Displaying table with ${totalLength} entries (first: ${first}, last: ${last})`);

  if (totalLength <= first + last) {
    tableLogger.debug('Displaying all entries');
    console.table(data.map((entry, index) => ({ index, ...entry })));
    return;
  }

  const firstEntries = data.slice(0, first).map(
    (entry, index) => ({ index, ...entry }));
  const lastEntries = data.slice(-last).map(
    (entry, index) => ({ index: totalLength - last + index, ...entry }));

  // Dynamically create a placeholder for the omitted entries
  const placeholder = { index: '...' };
  if (firstEntries.length > 0) {
    for (const key of Object.keys(firstEntries[0])) {
      if (key !== 'index') {
        placeholder[key] = '...';
      }
    }
  }

  // Combine the first entries, placeholder, and last entries
  const combinedEntries = [...firstEntries, placeholder, ...lastEntries];

  tableLogger.debug(`Displaying truncated table (${firstEntries.length} + ${lastEntries.length} entries shown)`);
  console.table(combinedEntries);
}

/**
 * Get the current date and time in local ISO format
 * @param {Date} date - The date object to convert.
 * @returns {string} The date and time in local ISO format.
 */
function toLocalISOFormat(date) {
  logger.debug(`Converting date to local ISO format: ${date}`);
  const localISODate = date.toISOString().slice(0, 19); // Remove the 'Z' at the end
  const timezoneOffset = -date.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  const offsetHours = String(
    Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');

  const result = `${localISODate}${offsetSign}${offsetHours}:${offsetMinutes}`;
  logger.debug(`Local ISO format result: ${result}`);
  return result;
}

/**
 * Convert a date string in UTC format to local ISO format
 * @param {string} dateString - The date string in yyyyMMddHHmmss format.
 * @returns {string|null} The date and time in local ISO format.
 */
function convertToLocalISOFormat(dateString) {
  const conversionLogger = createLogger('DATE_CONVERTER');

  if (dateString == null || dateString.length !== 14) {
    conversionLogger.warn(`Invalid date string: ${dateString}`);
    return null;
  }

  conversionLogger.debug(`Converting date string: ${dateString}`);

  // Extract components from the input string
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  const hour = dateString.slice(8, 10);
  const minute = dateString.slice(10, 12);
  const second = dateString.slice(12, 14);

  // Create a new Date object (assume input is in UTC)
  const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));

  // Convert to local time ISO format using the extracted function
  const result = toLocalISOFormat(date);
  conversionLogger.debug(`Conversion result: ${result}`);
  return result;
}

/**
 * Save data as JSON file
 * @param {string} fileName - The name of the file to save.
 * @param {Object} data - The data to save.
 * @returns {void}
 */
function saveAsJSON(fileName, data) {
  const saveLogger = createLogger('FILE_SAVER');

  saveLogger.info(`Saving data as JSON file: ${fileName}`);

  try {
    const fileContent = JSON.stringify(data);
    const bb = new Blob([fileContent], { type: "text/plain" });
    const a = document.createElement("a");
    const fullFileName = fileName + "_" + toLocalISOFormat(new Date()) + ".json";

    a.download = fullFileName;
    a.href = window.URL.createObjectURL(bb);
    a.click();

    saveLogger.info(`Successfully saved file: ${fullFileName}`);
  } catch (error) {
    saveLogger.error(`Failed to save JSON file: ${fileName}`, error);
    throw error;
  }
}

export {
  Logger,
  LogLevel,
  logger,
  createLogger,
  tokenize,
  customTable,
  toLocalISOFormat,
  convertToLocalISOFormat,
  saveAsJSON
};