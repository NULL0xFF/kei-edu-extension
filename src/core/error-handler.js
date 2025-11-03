/**
 * Error handling and logging
 */

import {LOGGING} from '../config/settings.js';

export class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

export const ERROR_CODE = {
  NETWORK: 'NETWORK_ERROR',
  STORAGE: 'STORAGE_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  API: 'API_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR'
};

class Logger {
  constructor() {
    this.level = LOGGING.currentLevel;
    this.enabled = LOGGING.enabled;
    this.buttonElement = null;
  }

  /**
   * Set button element for displaying messages
   * @param {HTMLElement} element - Button element
   */
  setButtonElement(element) {
    this.buttonElement = element;
  }

  /**
   * Clear button element reference
   */
  clearButtonElement() {
    this.buttonElement = null;
  }

  /**
   * Update button text if element is set
   * @param {string} text - Text to display
   * @private
   */
  _updateButtonText(text) {
    if (this.buttonElement) {
      this.buttonElement.innerHTML = `<span class="txt_white">${text}</span>`;
    }
  }

  error(message, ...args) {
    if (this.enabled && this.level >= LOGGING.level.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  warn(message, ...args) {
    if (this.enabled && this.level >= LOGGING.level.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  info(message, ...args) {
    if (this.enabled && this.level >= LOGGING.level.INFO) {
      console.log(`[INFO] ${message}`, ...args);
      this._updateButtonText(message);
    }
  }

  debug(message, ...args) {
    if (this.enabled && this.level >= LOGGING.level.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();

export class ErrorHandler {
  static handle(error, context = '') {
    const appError = error instanceof AppError
        ? error
        : new AppError(
            error.message || 'Unknown error',
            ERROR_CODE.UNKNOWN,
            {originalError: error, context}
        );

    logger.error(`${context}: ${appError.message}`, appError);
    return appError;
  }

  static networkError(message, details = null) {
    return new AppError(message, ERROR_CODE.NETWORK, details);
  }

  static storageError(message, details = null) {
    return new AppError(message, ERROR_CODE.STORAGE, details);
  }

  static validationError(message, details = null) {
    return new AppError(message, ERROR_CODE.VALIDATION, details);
  }

  static apiError(message, details = null) {
    return new AppError(message, ERROR_CODE.API, details);
  }
}
