/**
 * HTTP API client with retry logic
 */

import * as jQuery from 'jquery';
import {NETWORK} from '../config/constants.js';
import {ErrorHandler, logger} from './error-handler.js';

function getCSRFToken() {
  const meta = document.querySelector('meta[name="_csrf"]');
  return meta ? meta.getAttribute('content') : '';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class ApiClient {
  constructor() {
    this.csrfToken = getCSRFToken();
  }

  async post(url, data = {}, options = {}) {
    const {
      timeout = NETWORK.TIMEOUT,
      retries = NETWORK.RETRY_LIMIT,
      retryDelay = NETWORK.RETRY_DELAY,
      retryFactor = NETWORK.RETRY_FACTOR,
      retryCap = NETWORK.RETRY_CAP_MS,
      totalBudget = NETWORK.TOTAL_BUDGET_MS
    } = options;

    const startTime = Date.now();
    let attempt = 0;

    while (attempt <= retries) {
      try {
        const result = await new Promise((resolve, reject) => {
          jQuery.ajax({
            url,
            type: 'post',
            data,
            dataType: 'json',
            timeout,
            headers: {'X-CSRF-TOKEN': this.csrfToken},
            xhrFields: {withCredentials: true},
            success: resolve,
            error: (xhr, status, error) => {
              reject({xhr, status, error});
            }
          });
        });

        logger.debug(`Request succeeded: ${url}`);
        return result;

      } catch (err) {
        const {xhr, status, error} = err;
        const statusCode = xhr?.status;
        const isRetriable =
            status === 'timeout' ||
            status === 'error' ||
            [0, 429, 500, 502, 503, 504].includes(statusCode);

        if (!isRetriable || attempt >= retries) {
          throw ErrorHandler.networkError(
              error || status || 'Request failed',
              {url, status: statusCode, statusText: status}
          );
        }

        attempt++;
        logger.warn(
            `Request failed for ${url} (attempt ${attempt}/${retries}), retrying...`,
            {status: statusCode, statusText: status}
        );

        // Calculate delay with exponential backoff
        const exponentialDelay = Math.min(
            retryCap,
            retryDelay * Math.pow(retryFactor, attempt - 1)
        );

        // Check Retry-After header
        const retryAfter = xhr?.getResponseHeader('Retry-After');
        const delay = retryAfter
            ? Math.max(exponentialDelay, Number(retryAfter) * 1000)
            : exponentialDelay;

        // Check total budget
        const elapsed = Date.now() - startTime;
        if (elapsed + delay > totalBudget) {
          throw ErrorHandler.networkError('Retry budget exceeded', {url});
        }

        await sleep(delay);
      }
    }
  }

  refreshToken() {
    this.csrfToken = getCSRFToken();
    logger.debug('CSRF token refreshed');
  }
}

export const apiClient = new ApiClient();
