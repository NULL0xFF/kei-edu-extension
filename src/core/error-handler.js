/**
 * @file error-handler.js
 * @description 통합 에러 처리 모듈
 */

import { LOGGING } from '../config/settings.js';

/**
 * 커스텀 에러 클래스
 */
export class AppError extends Error {
  constructor(message, code, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * 에러 코드
 */
export const ERROR_CODE = {
  NETWORK: 'NETWORK_ERROR',
  STORAGE: 'STORAGE_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  API: 'API_ERROR',
  PARSE: 'PARSE_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * 로거 클래스
 */
class Logger {
  constructor() {
    this.level = LOGGING.currentLevel;
    this.enabled = LOGGING.enabled;
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
    }
  }

  debug(message, ...args) {
    if (this.enabled && this.level >= LOGGING.level.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();

/**
 * 에러 핸들러
 */
export class ErrorHandler {
  /**
   * 에러 처리
   * @param {Error} error - 에러 객체
   * @param {string} context - 에러 발생 컨텍스트
   * @returns {AppError} 처리된 에러 객체
   */
  static handle(error, context = '') {
    let appError;

    if (error instanceof AppError) {
      appError = error;
    } else {
      appError = new AppError(
        error.message || 'Unknown error occurred',
        ERROR_CODE.UNKNOWN,
        { originalError: error, context }
      );
    }

    logger.error(`${context}: ${appError.message}`, appError);
    return appError;
  }

  /**
   * 네트워크 에러 생성
   * @param {string} message - 에러 메시지
   * @param {Object} details - 상세 정보
   * @returns {AppError}
   */
  static networkError(message, details = null) {
    return new AppError(message, ERROR_CODE.NETWORK, details);
  }

  /**
   * 스토리지 에러 생성
   * @param {string} message - 에러 메시지
   * @param {Object} details - 상세 정보
   * @returns {AppError}
   */
  static storageError(message, details = null) {
    return new AppError(message, ERROR_CODE.STORAGE, details);
  }

  /**
   * 검증 에러 생성
   * @param {string} message - 에러 메시지
   * @param {Object} details - 상세 정보
   * @returns {AppError}
   */
  static validationError(message, details = null) {
    return new AppError(message, ERROR_CODE.VALIDATION, details);
  }

  /**
   * API 에러 생성
   * @param {string} message - 에러 메시지
   * @param {Object} details - 상세 정보
   * @returns {AppError}
   */
  static apiError(message, details = null) {
    return new AppError(message, ERROR_CODE.API, details);
  }

  /**
   * 파싱 에러 생성
   * @param {string} message - 에러 메시지
   * @param {Object} details - 상세 정보
   * @returns {AppError}
   */
  static parseError(message, details = null) {
    return new AppError(message, ERROR_CODE.PARSE, details);
  }
}
