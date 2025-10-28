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
 * 딜레이 유틸리티
 * @param {number} ms - 딜레이 시간 (밀리초)
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * API 클라이언트 클래스
 */
export class ApiClient {
  constructor() {
    this.csrfToken = getCSRFToken();
  }

  /**
   * HTTP POST 요청 (재시도 및 타임아웃 로직 포함)
   * @param {string} url - 요청 URL
   * @param {Object} data - 요청 데이터
   * @param {Object} options - 추가 옵션
   * @returns {Promise<Object>} 응답 데이터
   */
  post(url, data = {}, options = {}) {
    const {
      timeout = NETWORK.TIMEOUT || 5000,
      retries = NETWORK.RETRY_LIMIT || 5,
      retryInitialDelayMs = NETWORK.RETRY_DELAY || 1000,
      retryFactor = 2,
      retryCapMs = 16000,
      totalBudgetMs = 60000,
      signal,
    } = options;

    return new Promise((resolve, reject) => {
      let attempt = 0;
      const t0 = Date.now();
      let currentXHR;

      const abortHandler = () => {
        currentXHR?.abort();
        reject(new DOMException('Aborted', 'AbortError'));
      };

      if (signal) {
        if (signal.aborted) {
          return reject(new DOMException('Aborted', 'AbortError'));
        }
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      const attemptRequest = async () => {
        if (signal?.aborted) return;

        currentXHR = jQuery.ajax({
          url,
          type: 'post',
          data,
          dataType: 'json',
          timeout,
          headers: { 'X-CSRF-TOKEN': this.csrfToken },
          xhrFields: { withCredentials: true },
        })
          .done(response => {
            signal?.removeEventListener('abort', abortHandler);
            logger.debug(`Request succeeded: ${url}`, response);
            resolve(response);
          })
          .fail(async (xhr, textStatus, errorThrown) => {
            const status = xhr?.status;
            const isRetriable = textStatus === 'timeout' || textStatus === 'error' || [0, 429, 500, 502, 503, 504].includes(status);

            if (!isRetriable || attempt >= retries || signal?.aborted) {
              signal?.removeEventListener('abort', abortHandler);
              const error = ErrorHandler.networkError(errorThrown || textStatus || 'AJAX failed', { url, status, textStatus });
              logger.error(`Request failed permanently for ${url}`, error);
              return reject(error);
            }

            attempt++;
            logger.warn(`Request failed for ${url} (attempt ${attempt}/${retries}). Retrying...`, { status, textStatus });

            const retryAfterHeader = Number(xhr?.getResponseHeader?.('Retry-After'));
            const exponentialDelay = Math.min(retryCapMs, retryInitialDelayMs * (retryFactor ** (attempt - 1)));
            let delay = Number.isFinite(retryAfterHeader) ? Math.max(exponentialDelay, retryAfterHeader * 1000) : exponentialDelay;

            const elapsed = Date.now() - t0;
            if (elapsed + delay > totalBudgetMs) {
              delay = Math.max(0, totalBudgetMs - elapsed);
            }

            if (delay > 0) {
              await sleep(delay);
            }

            if (Date.now() - t0 >= totalBudgetMs) {
              signal?.removeEventListener('abort', abortHandler);
              const budgetError = ErrorHandler.networkError('Retry budget exceeded', { url });
              logger.error(`Retry budget exceeded for ${url}`, budgetError);
              return reject(budgetError);
            }

            attemptRequest();
          });
      };

      attemptRequest();
    });
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