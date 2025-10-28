/**
 * @file api-client.js
 * @description HTTP 통신 핵심 로직
 */

import * as jQuery from 'jquery';
import { NETWORK } from '../config/constants.js';
import { ErrorHandler, logger } from './error-handler.js';

/**
 * CSRF 토큰 가져오기
 * @returns {string} CSRF 토큰
 */
function getCSRFToken() {
  const tokenInput = document.querySelector('input[name="_csrf"]');
  return tokenInput ? tokenInput.value : '';
}

/**
 * API 클라이언트 클래스
 */
export class ApiClient {
  constructor() {
    this.csrfToken = getCSRFToken();
  }

  /**
   * HTTP POST 요청
   * @param {string} url - 요청 URL
   * @param {Object} data - 요청 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 응답 데이터
   */
  async post(url, data = {}, options = {}) {
    const {
      retryLimit = NETWORK.RETRY_LIMIT,
      timeout = NETWORK.TIMEOUT,
      retryDelay = NETWORK.RETRY_DELAY,
    } = options;

    return this._requestWithRetry(
      url,
      data,
      { retryLimit, timeout, retryDelay }
    );
  }

  /**
   * 재시도 로직이 포함된 요청
   * @private
   */
  async _requestWithRetry(url, data, options) {
    let lastError;

    for (let attempt = 0; attempt <= options.retryLimit; attempt++) {
      try {
        if (attempt > 0) {
          logger.info(`Retry attempt ${attempt}/${options.retryLimit} for ${url}`);
          await this._delay(options.retryDelay * attempt);
        }

        const response = await this._executeRequest(url, data, options.timeout);
        return response;
      } catch (error) {
        lastError = error;
        logger.warn(`Request failed (attempt ${attempt + 1}): ${error.message}`);
      }
    }

    throw ErrorHandler.networkError(
      `Request failed after ${options.retryLimit + 1} attempts`,
      { url, lastError }
    );
  }

  /**
   * 실제 요청 실행
   * @private
   */
  _executeRequest(url, data, timeout) {
    return new Promise((resolve, reject) => {
      jQuery.ajax({
        headers: {
          'X-CSRF-TOKEN': this.csrfToken,
        },
        xhrFields: {
          withCredentials: true,
        },
        url,
        type: 'post',
        data,
        dataType: 'json',
        timeout,
        success: (response) => {
          logger.debug(`Request succeeded: ${url}`, response);
          resolve(response);
        },
        error: (xhr, status, error) => {
          const errorMessage = this._parseErrorResponse(xhr, status, error);
          reject(new Error(errorMessage));
        },
      });
    });
  }

  /**
   * 에러 응답 파싱
   * @private
   */
  _parseErrorResponse(xhr, status, error) {
    if (xhr.responseJSON && xhr.responseJSON.message) {
      return xhr.responseJSON.message;
    }
    if (status === 'timeout') {
      return 'Request timeout';
    }
    if (status === 'abort') {
      return 'Request aborted';
    }
    return error || 'Unknown network error';
  }

  /**
   * 딜레이 유틸리티
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * CSRF 토큰 갱신
   */
  refreshToken() {
    this.csrfToken = getCSRFToken();
    logger.debug('CSRF token refreshed');
  }
}

// 싱글톤 인스턴스
export const apiClient = new ApiClient();