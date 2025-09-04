import * as jQuery from 'jquery';
import { customTable, getCSRFToken } from './shared.js';
import { addData, getData, updateData } from "./storage";
import { estimatedProgressTime } from "./solution";

/**
 * Represents a completion.
 * @class
 * @property {number} csMemberSeq - The member sequence number.
 * @property {string} csMemberId - The member username.
 * @property {string} csMemberName - The member name.
 * @property {string} cxMemberEmail - The member email.
 * @property {string} csApplyStatusCd - The application status code.
 * @property {string} csCompletionYn - The completion status.
 * @property {Date|null} cxCompletionDate - The completion date.
 * @constructor
 * @param {number} csMemberSeq - The member sequence number.
 * @param {string} csMemberId - The member username.
 * @param {string} csMemberName - The member name.
 * @param {string} cxMemberEmail - The member email.
 * @param {string} csApplyStatusCd - The application status code.
 * @param {string} csStudyStartDate - The study start date.
 * @param {string} csCompletionYn - The completion status.
 * @param {string} cxCompletionDate - The completion date.
 * @returns {Completion} - The completion object.
 */
class Completion {
  constructor(csMemberSeq, csMemberId, csMemberName, cxMemberEmail,
    csApplyStatusCd, csStudyStartDate, csCompletionYn, cxCompletionDate) {
    this.csMemberSeq = csMemberSeq;
    this.csMemberId = csMemberId;
    this.csMemberName = csMemberName;
    this.cxMemberEmail = cxMemberEmail;
    this.csApplyStatusCd = csApplyStatusCd;
    this.csStudyStartDate = csStudyStartDate;
    this.csCompletionYn = csCompletionYn;
    this.cxCompletionDate = this.formatCompletionDate(cxCompletionDate);
  }

  /**
   * Formats the completion date.
   *
   * Original Date: yyyyMMddHHmmss
   * Formatted Date: yyyy-MM-dd
   *
   * Be careful that original date value is offset with local timezone.
   * Get the timezone offset and calculate actual UTC time.
   *
   * @param cxCompletionDate
   * @returns {Date|null}
   */
  formatCompletionDate(cxCompletionDate) {
    if (cxCompletionDate === null) {
      return null;
    }

    // Get the timezone offset.
    const timezoneOffset = new Date().getTimezoneOffset() * 60000;

    // Get the year, month, day, hour, minute, and second.
    const year = cxCompletionDate.substring(0, 4);
    const month = cxCompletionDate.substring(4, 6);
    const day = cxCompletionDate.substring(6, 8);
    const hour = cxCompletionDate.substring(8, 10);
    const minute = cxCompletionDate.substring(10, 12);
    const second = cxCompletionDate.substring(12, 14);

    // Return the formatted date.
    return new Date(
      Date.UTC(year, month - 1, day, hour, minute, second) + timezoneOffset);
  }
}

/**
 * Represents a completion request.
 * @class
 * @constructor
 * @param {number} courseActiveSeq - The course active sequence number.
 * @param {number} count - The number of search results to return.
 * @param {boolean} completion - The completion status.
 * @returns {CompletionRequest} - The completion request object.
 */
class CompletionRequest {
  static MENU_ID = 'MG0036';
  static Order = {
    MEMBER_ASC: 1, // Member Ascending (회원 오름차순)
    MEMBER_DESC: -1, // Member Descending (회원 내림차순)
    END_DATE_ASC: 4, // End Date Ascending (종료일 오름차순)
    END_DATE_DESC: -4 // End Date Descending (종료일 내림차순)
  }

  constructor(courseActiveSeq = 0, count = 10, completion = '') {
    this.pageIndex = 1;
    this.searchListCnt = count;
    this.orderBy = this.constructor.Order.MEMBER_ASC;
    this.dspLinkMenuId = this.constructor.MENU_ID;
    this.dspMenuId = this.constructor.MENU_ID;
    this.searchCsCourseActiveSeq = courseActiveSeq;
    this.searchCsCompletionYn = completion;
    this.searchCsMemberName = '';
    this.searchCsMemberId = '';
  }
}

/**
 * Represents a application request.
 * @class
 * @constructor
 * @param {number} courseActiveSeq - The course active sequence number.
 * @param {number} courseMasterSeq - The course master sequence number.
 * @param {number} count - The number of search results to return.
 * @returns {ApplicationRequest} - The completion request object.
 */
class ApplicationRequest {
  static MENU_ID = 'MG0028';

  constructor(courseActiveSeq = 0, courseMasterSeq = 0, count = 10) {
    this.pageIndex = 1;
    this.searchListCnt = count;
    this.dspLinkMenuId = this.constructor.MENU_ID;
    this.dspMenuId = this.constructor.MENU_ID;
    this.searchCsCourseActiveSeq = courseActiveSeq;
    this.searchCsCourseMasterSeq = courseMasterSeq;
    // TODO: Implement following search criteria.
    this.searchCsApplyStatusCd = '';
    this.searchCxDivisionCd = '';
    this.searchCsMemberId = '';
    this.searchCsMemberName = '';
  }
}

/**
 * Represents a course.
 * @class
 * @constructor
 * @param {number} csCourseActiveSeq - The course active sequence number.
 * @param {number} csCourseMasterSeq - The course master sequence number.
 * @param {string} csTitle - The course title.
 * @param {string} csStatusCd - The course status code.
 * @param {string} csCourseTypeCd - The course type code.
 * @param {number} csYear - The course year.
 * @param {string} csApplyStartDate - The course application start date.
 * @param {string} csApplyEndDate - The course application end date.
 * @param {string} csStudyStartDate - The course study start date.
 * @param {string} csStudyEndDate - The course study end date.
 * @param {string} csOpenStartDate - The course open start date.
 * @param {string} csOpenEndDate - The course open end date.
 * @param {number} csCmplTime - The course completion time.
 * @param {string} csTitlePath - The course title path.
 * @param {Completion[]} csCmplList - The course completion list.
 * @returns {Course} - The course object.
 */
class Course {
  static Status = {
    ACTIVE: 'active', INACTIVE: 'inactive'
  }
  static Type = {
    ALWAYS: 'always', PERIOD: 'period'
  }
  static Category = {
    INTRO: '입문',
    ADVANCED: '심화',
    GENERAL: '일반',
    CUSTOMIZED: '맞춤형',
    FOREIGN: '외국어'
  }

  constructor(csCourseActiveSeq, csCourseMasterSeq, csTitle, csStatusCd,
    csCourseTypeCd, csYear, csApplyStartDate, csApplyEndDate,
    csStudyStartDate, csStudyEndDate, csOpenStartDate, csOpenEndDate,
    csCmplTime, csTitlePath, csCmplList = []) {
    this.csCourseActiveSeq = csCourseActiveSeq; // Class Unique Identifier
    this.csCourseMasterSeq = csCourseMasterSeq; // Class Creation Group, Master Identifier
    this.csTitle = csTitle;
    this.csStatusCd = csStatusCd; // Status
    this.csCourseTypeCd = csCourseTypeCd; // Type
    this.csYear = csYear;
    this.csApplyStartDate = csApplyStartDate;
    this.csApplyEndDate = csApplyEndDate;
    this.csStudyStartDate = csStudyStartDate;
    this.csStudyEndDate = csStudyEndDate;
    this.csOpenStartDate = csOpenStartDate;
    this.csOpenEndDate = csOpenEndDate;
    this.csCmplTime = csCmplTime;
    this.csTitlePath = csTitlePath; // Category
    this.csCmplList = csCmplList; // Completion List
  }
}

/**
 * Represents a course request.
 * @class
 * @constructor
 * @param {string} search - The search criteria.
 * @param {number} count - The number of search results to return.
 * @param {number} year - The year to search for.
 * @returns {CourseRequest} - The course request object.
 */
class CourseRequest {
  static Order = {
    TITLE_ASC: 1, // Title Ascending (과정명 오름차순)
    TITLE_DESC: -1, // Title Descending (과정명 내림차순)
    CATEGORY_ASC: 2, // Category Ascending (과정분류 오름차순)
    CATEGORY_DESC: -2, // Category Descending (과정분류 내림차순)
    STATUS_ASC: 3, // Status Ascending (운영상태 오름차순)
    STATUS_DESC: -3, // Status Descending (운영상태 내림차순)
    DATE_ASC: 4, // Date Ascending (등록일 오름차순)
    DATE_DESC: -4 // Date Descending (등록일 내림차순)
  }
  static Category = {
    ALL: '', // All (전체)
    INTRO: '1', // Introduction (입문)
    ADVANCED: '2', // Advanced (심화)
    GENERAL: '3', // General (일반)
    CUSTOMIZED: '14', // Customized (맞춤형)
    FOREIGN: '16' // Foreign (외국어)
  }
  static Type = {
    ALL: '', // All (전체)
    ALWAYS: 'always', // Always (상시제)
    PERIOD: 'period' // Period (기수제)
  }
  static Status = {
    ALL: '', // All (전체)
    ACTIVE: 'active', // Active (활성)
    INACTIVE: 'inactive' // Inactive (비활성)
  }

  constructor(count = 10, search = '', year = '') {
    this.pageIndex = 1;
    this.searchListCnt = count;
    this.orderBy = this.constructor.Order.DATE_DESC;
    this.dspLinkMenuId = 'MG0027';
    this.dspMenuId = 'MG0027';
    this.searchCsCategorySeq = this.constructor.Category.ALL;
    this.searchCsSubjectCode = ''; // Subject Type (교육분야)
    this.searchCsYear = year;
    this.searchCsCourseTypeCd = this.constructor.Type.ALL;
    this.searchCsStatusCd = this.constructor.Status.ALL;
    this.searchCsTitle = search;
  }
}

// =============================================================================
// NETWORK RESILIENCE AND CONNECTION MANAGEMENT
// =============================================================================

/**
 * Network resilience configuration
 */
const NETWORK_CONFIG = {
  // Basic settings
  INITIAL_CONCURRENCY: 2,           // Start conservative
  MAX_CONCURRENCY: 8,               // Maximum concurrent requests
  MIN_CONCURRENCY: 1,               // Minimum concurrent requests

  // Timeout settings
  BASE_TIMEOUT: 15000,              // Base timeout (15s)
  MAX_TIMEOUT: 60000,               // Maximum timeout (60s)
  LONG_OPERATION_TIMEOUT: 120000,   // For completion data (2 minutes)

  // Retry and backoff
  MAX_RETRIES: 5,                   // Maximum retry attempts
  INITIAL_BACKOFF: 1000,            // Initial backoff (1s)
  MAX_BACKOFF: 30000,               // Maximum backoff (30s)
  BACKOFF_MULTIPLIER: 1.5,          // Backoff multiplier
  JITTER_FACTOR: 0.1,               // Add randomization to prevent thundering herd

  // Circuit breaker
  ERROR_THRESHOLD: 0.3,             // Error rate threshold (30%)
  RECOVERY_TIMEOUT: 60000,          // Time to wait before recovery attempt (60s)
  SAMPLE_SIZE: 10,                  // Sample size for error rate calculation

  // Rate limiting
  ADAPTIVE_RATE_LIMITING: true,     // Enable adaptive rate limiting
  RATE_LIMIT_WINDOW: 10000,         // Rate limit window (10s)
  SUCCESS_RATE_THRESHOLD: 0.8,      // Success rate threshold for increasing concurrency

  // Connection management  
  KEEP_ALIVE: true,                 // Use keep-alive connections
  CONNECTION_POOL_SIZE: 10,         // Connection pool size
  IDLE_TIMEOUT: 30000,              // Connection idle timeout

  // Batching
  BATCH_DELAY_MIN: 200,             // Minimum delay between batches
  BATCH_DELAY_MAX: 2000,            // Maximum delay between batches
  ADAPTIVE_BATCH_DELAY: true,       // Adapt batch delay based on performance

  // Cache
  CACHE_TTL: 10 * 60 * 1000,        // 10 minutes cache TTL

  // Health monitoring
  HEALTH_CHECK_INTERVAL: 30000,     // Health check interval (30s)
  PERFORMANCE_MONITORING: true,     // Enable performance monitoring
};

/**
 * Global state for network management
 */
const NetworkState = {
  currentConcurrency: NETWORK_CONFIG.INITIAL_CONCURRENCY,
  circuitBreakerOpen: false,
  circuitBreakerOpenTime: 0,
  recentRequests: [],
  performanceMetrics: {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    timeoutRequests: 0,
    avgResponseTime: 0,
    lastResponseTimes: []
  },
  activeConnections: 0,
  rateLimitTokens: NETWORK_CONFIG.MAX_CONCURRENCY,
  lastTokenRefill: Date.now(),
  healthStatus: 'healthy', // 'healthy', 'degraded', 'unhealthy'
  adaptiveBatchDelay: NETWORK_CONFIG.BATCH_DELAY_MIN
};

/**
 * Global cache for API responses
 */
const apiCache = new Map();

// =============================================================================
// CIRCUIT BREAKER PATTERN
// =============================================================================

/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
  static isOpen() {
    if (!NetworkState.circuitBreakerOpen) return false;

    const timeSinceOpen = Date.now() - NetworkState.circuitBreakerOpenTime;
    if (timeSinceOpen > NETWORK_CONFIG.RECOVERY_TIMEOUT) {
      console.log('🔧 Circuit breaker attempting recovery...');
      NetworkState.circuitBreakerOpen = false;
      NetworkState.currentConcurrency = 1; // Start with minimal concurrency
      return false;
    }

    return true;
  }

  static recordSuccess() {
    NetworkState.recentRequests.push({ success: true, timestamp: Date.now() });
    this.cleanup();
    NetworkState.performanceMetrics.successfulRequests++;
  }

  static recordFailure(isTimeout = false) {
    NetworkState.recentRequests.push({ success: false, timestamp: Date.now(), timeout: isTimeout });
    this.cleanup();

    NetworkState.performanceMetrics.failedRequests++;
    if (isTimeout) {
      NetworkState.performanceMetrics.timeoutRequests++;
    }

    this.checkThreshold();
  }

  static cleanup() {
    const cutoff = Date.now() - NETWORK_CONFIG.RATE_LIMIT_WINDOW;
    NetworkState.recentRequests = NetworkState.recentRequests.filter(req => req.timestamp > cutoff);
  }

  static checkThreshold() {
    if (NetworkState.recentRequests.length < NETWORK_CONFIG.SAMPLE_SIZE) return;

    const failures = NetworkState.recentRequests.filter(req => !req.success).length;
    const errorRate = failures / NetworkState.recentRequests.length;

    if (errorRate > NETWORK_CONFIG.ERROR_THRESHOLD && !NetworkState.circuitBreakerOpen) {
      console.warn(`⚠️ Circuit breaker opened! Error rate: ${(errorRate * 100).toFixed(1)}%`);
      NetworkState.circuitBreakerOpen = true;
      NetworkState.circuitBreakerOpenTime = Date.now();
      NetworkState.currentConcurrency = 1;
    }
  }

  static getStats() {
    this.cleanup();
    const total = NetworkState.recentRequests.length;
    const failures = NetworkState.recentRequests.filter(req => !req.success).length;
    const timeouts = NetworkState.recentRequests.filter(req => req.timeout).length;

    return {
      isOpen: this.isOpen(),
      errorRate: total > 0 ? failures / total : 0,
      timeoutRate: total > 0 ? timeouts / total : 0,
      sampleSize: total
    };
  }
}

// =============================================================================
// ADAPTIVE RATE LIMITING
// =============================================================================

/**
 * Adaptive Rate Limiter
 */
class RateLimiter {
  static async acquireToken() {
    await this.refillTokens();

    if (CircuitBreaker.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    if (NetworkState.rateLimitTokens <= 0) {
      const waitTime = this.getWaitTime();
      console.log(`⏳ Rate limit reached, waiting ${waitTime}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquireToken(); // Recursive retry
    }

    NetworkState.rateLimitTokens--;
    NetworkState.activeConnections++;
    return true;
  }

  static releaseToken() {
    NetworkState.activeConnections = Math.max(0, NetworkState.activeConnections - 1);
  }

  static async refillTokens() {
    const now = Date.now();
    const timePassed = now - NetworkState.lastTokenRefill;

    if (timePassed >= 1000) { // Refill every second
      const tokensToAdd = Math.floor(timePassed / 1000) * this.getRefillRate();
      NetworkState.rateLimitTokens = Math.min(
        NetworkState.currentConcurrency,
        NetworkState.rateLimitTokens + tokensToAdd
      );
      NetworkState.lastTokenRefill = now;
    }
  }

  static getRefillRate() {
    const stats = CircuitBreaker.getStats();

    if (stats.isOpen) return 0;
    if (stats.errorRate > 0.2) return 1; // Slow refill on high errors
    if (stats.errorRate < 0.1) return NetworkState.currentConcurrency; // Fast refill on low errors

    return Math.ceil(NetworkState.currentConcurrency / 2); // Medium refill
  }

  static getWaitTime() {
    const baseWait = 1000;
    const backoffMultiplier = Math.pow(2, Math.min(5, NetworkState.performanceMetrics.failedRequests / 10));
    return baseWait * backoffMultiplier + (Math.random() * 500); // Add jitter
  }

  static adaptConcurrency() {
    if (!NETWORK_CONFIG.ADAPTIVE_RATE_LIMITING) return;

    const stats = CircuitBreaker.getStats();
    const currentSuccessRate = 1 - stats.errorRate;
    const avgResponseTime = this.getAverageResponseTime();

    const oldConcurrency = NetworkState.currentConcurrency;

    // Increase concurrency if performance is good
    if (currentSuccessRate > NETWORK_CONFIG.SUCCESS_RATE_THRESHOLD && avgResponseTime < 5000) {
      NetworkState.currentConcurrency = Math.min(
        NETWORK_CONFIG.MAX_CONCURRENCY,
        NetworkState.currentConcurrency + 1
      );
    }
    // Decrease concurrency if performance is poor
    else if (currentSuccessRate < 0.7 || avgResponseTime > 15000 || stats.timeoutRate > 0.1) {
      NetworkState.currentConcurrency = Math.max(
        NETWORK_CONFIG.MIN_CONCURRENCY,
        NetworkState.currentConcurrency - 1
      );
    }

    if (oldConcurrency !== NetworkState.currentConcurrency) {
      console.log(`📈 Adapted concurrency: ${oldConcurrency} → ${NetworkState.currentConcurrency} (success rate: ${(currentSuccessRate * 100).toFixed(1)}%, avg response: ${avgResponseTime.toFixed(0)}ms)`);
    }
  }

  static getAverageResponseTime() {
    const times = NetworkState.performanceMetrics.lastResponseTimes;
    if (times.length === 0) return 0;
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }
}

// =============================================================================
// ROBUST API CALL INFRASTRUCTURE
// =============================================================================

/**
 * Enhanced AJAX call with network resilience features
 */
async function robustApiCall(options) {
  const startTime = Date.now();
  let lastError = null;

  // Acquire rate limiting token
  await RateLimiter.acquireToken();

  try {
    for (let attempt = 0; attempt <= NETWORK_CONFIG.MAX_RETRIES; attempt++) {
      try {
        // Calculate adaptive timeout
        const timeout = Math.min(
          NETWORK_CONFIG.MAX_TIMEOUT,
          NETWORK_CONFIG.BASE_TIMEOUT * Math.pow(1.5, attempt)
        );

        // Add jitter to prevent thundering herd
        if (attempt > 0) {
          const jitter = Math.random() * NETWORK_CONFIG.JITTER_FACTOR * 1000;
          const backoffTime = Math.min(
            NETWORK_CONFIG.MAX_BACKOFF,
            NETWORK_CONFIG.INITIAL_BACKOFF * Math.pow(NETWORK_CONFIG.BACKOFF_MULTIPLIER, attempt - 1)
          );

          console.debug(`⏳ Retry ${attempt}/${NETWORK_CONFIG.MAX_RETRIES} after ${backoffTime + jitter}ms for ${options.url}`);
          await new Promise(resolve => setTimeout(resolve, backoffTime + jitter));
        }

        // Execute the API call
        const result = await new Promise((resolve, reject) => {
          const ajaxOptions = {
            ...options,
            timeout,
            headers: {
              'X-CSRF-TOKEN': getCSRFToken(),
              'Connection': NETWORK_CONFIG.KEEP_ALIVE ? 'keep-alive' : 'close',
              ...options.headers
            },
            xhrFields: {
              withCredentials: true,
              ...options.xhrFields
            },
            success: function (data) {
              resolve(data);
            },
            error: function (xhr, status, error) {
              reject(new Error(`${error} (${status}) - ${xhr.status || 'No status'}`));
            }
          };

          jQuery.ajax(ajaxOptions);
        });

        // Record success metrics
        const responseTime = Date.now() - startTime;
        NetworkState.performanceMetrics.totalRequests++;
        NetworkState.performanceMetrics.lastResponseTimes.push(responseTime);

        // Keep only recent response times
        if (NetworkState.performanceMetrics.lastResponseTimes.length > 50) {
          NetworkState.performanceMetrics.lastResponseTimes =
            NetworkState.performanceMetrics.lastResponseTimes.slice(-25);
        }

        CircuitBreaker.recordSuccess();
        RateLimiter.adaptConcurrency();

        return result;

      } catch (error) {
        lastError = error;
        const isTimeout = error.message.includes('timeout') || error.message.includes('TIMEOUT');
        const isConnectionError = error.message.includes('CONNECTION') || error.message.includes('NETWORK');

        NetworkState.performanceMetrics.totalRequests++;
        CircuitBreaker.recordFailure(isTimeout);

        // Don't retry on certain types of errors
        if (error.message.includes('404') || error.message.includes('401') || error.message.includes('403')) {
          console.error(`❌ Non-retryable error for ${options.url}:`, error.message);
          break;
        }

        // Log different types of errors
        if (isTimeout) {
          console.warn(`⏱️ Timeout on attempt ${attempt + 1} for ${options.url}`);
        } else if (isConnectionError) {
          console.warn(`🔌 Connection error on attempt ${attempt + 1} for ${options.url}:`, error.message);
        } else {
          console.warn(`❌ Error on attempt ${attempt + 1} for ${options.url}:`, error.message);
        }

        // Don't retry on the last attempt
        if (attempt === NETWORK_CONFIG.MAX_RETRIES) {
          break;
        }
      }
    }

    // If we get here, all retries failed
    throw lastError || new Error('All retry attempts failed');

  } finally {
    RateLimiter.releaseToken();
  }
}

/**
 * Cached API call with network resilience
 */
async function cachedRobustApiCall(cacheKey, options) {
  // Check cache first
  if (apiCache.has(cacheKey)) {
    const cachedResult = apiCache.get(cacheKey);
    const now = Date.now();

    if (now - cachedResult.timestamp < NETWORK_CONFIG.CACHE_TTL) {
      console.debug(`💾 Cache hit for ${cacheKey}`);
      return cachedResult.data;
    } else {
      apiCache.delete(cacheKey);
    }
  }

  console.debug(`🌐 Making API call for ${cacheKey}`);
  const result = await robustApiCall(options);

  // Cache the result
  apiCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

// =============================================================================
// OPTIMIZED API FUNCTIONS WITH NETWORK RESILIENCE
// =============================================================================

/**
 * Network-resilient version of getCompletionCount
 */
async function getCompletionCountResilient(csCourseActiveSeq) {
  const cacheKey = `completion_count_${csCourseActiveSeq}`;

  return await cachedRobustApiCall(cacheKey, {
    url: "/course/cmpl/selectCmplList.do",
    type: "post",
    data: new CompletionRequest(csCourseActiveSeq),
    dataType: "json"
  }).then(data => data.cnt);
}

/**
 * Network-resilient version of getCourseClassCount
 */
async function getCourseClassCountResilient(csCourseActiveSeq) {
  const cacheKey = `class_count_${csCourseActiveSeq}`;

  const request = {
    csCourseActiveSeq: csCourseActiveSeq,
    csReferenceTypeCd: 'organization',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  };

  return await cachedRobustApiCall(cacheKey, {
    url: "/course/active/selectAtiveElementList.do",
    type: "post",
    data: request,
    dataType: "json"
  }).then(data => data.list.length);
}

/**
 * Network-resilient version of getCourseExamCount
 */
async function getCourseExamCountResilient(course) {
  const cacheKey = `exam_count_${course.csCourseActiveSeq}`;

  const request = {
    csCourseActiveSeq: course.csCourseActiveSeq,
    csReferenceTypeCd: 'exam',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  };

  return await cachedRobustApiCall(cacheKey, {
    url: "/course/active/selectAtiveElementList.do",
    type: "post",
    data: request,
    dataType: "json"
  }).then(data => data.list.length);
}

/**
 * Network-resilient version of getCourseCompletion
 */
async function getCourseCompletionResilient(csCourseActiveSeq, csCourseMasterSeq, count) {
  // Function to fetch completion list
  const fetchCompletionList = async () => {
    return await robustApiCall({
      url: "/course/cmpl/selectCmplList.do",
      type: "post",
      data: new CompletionRequest(Number(csCourseActiveSeq), count),
      dataType: "json"
    }).then(data => data.list.map(completion => ({
      csMemberSeq: completion.csMemberSeq,
      csMemberId: completion.csMemberId,
      csMemberName: completion.csMemberName,
      cxMemberEmail: completion.cxMemberEmail,
      csApplyStatusCd: completion.csApplyStatusCd,
      csStudyStartDate: '',
      csCompletionYn: completion.csCompletionYn,
      cxCompletionDate: completion.cxCompletionDate
    })));
  };

  // Function to fetch study start dates
  const fetchStudyStartDates = async () => {
    return await robustApiCall({
      url: "/course/apply/selectApplyList.do",
      type: "post",
      data: new ApplicationRequest(Number(csCourseActiveSeq), Number(csCourseMasterSeq), count),
      dataType: "json"
    }).then(data => {
      const startDateMap = new Map();
      data.list.forEach(apply => {
        startDateMap.set(apply.csMemberSeq, apply.csStudyStartDate);
      });
      return startDateMap;
    });
  };

  try {
    // Execute both calls with some delay to avoid overwhelming the server
    const completionListPromise = fetchCompletionList();

    // Add a small delay before the second call
    await new Promise(resolve => setTimeout(resolve, 100));
    const startDateMapPromise = fetchStudyStartDates();

    const [completionList, startDateMap] = await Promise.all([
      completionListPromise,
      startDateMapPromise
    ]);

    return completionList.map(completion => {
      return new Completion(
        completion.csMemberSeq,
        completion.csMemberId,
        completion.csMemberName,
        completion.cxMemberEmail,
        completion.csApplyStatusCd,
        startDateMap.get(completion.csMemberSeq) || '',
        completion.csCompletionYn,
        completion.cxCompletionDate
      );
    });
  } catch (error) {
    console.error(`Error fetching course completion for ${csCourseActiveSeq}:`, error);
    throw error;
  }
}

/**
 * Network-resilient version of getTotalCourseCount
 */
async function getTotalCourseCountResilient() {
  return await robustApiCall({
    url: "/course/active/selectActiveOperList.do",
    type: "post",
    data: new CourseRequest(),
    dataType: "json"
  }).then(data => data.cnt);
}

/**
 * Network-resilient version of getCourses
 */
async function getCoursesResilient(count = 10) {
  return await robustApiCall({
    url: "/course/active/selectActiveOperList.do",
    type: "post",
    data: new CourseRequest(count),
    dataType: "json"
  }).then(data => data.list.map(course => new Course(
    course.csCourseActiveSeq,
    course.csCourseMasterSeq,
    course.csTitle,
    course.csStatusCd,
    course.csCourseTypeCd,
    course.csYear,
    course.csApplyStartDate,
    course.csApplyEndDate,
    course.csStudyStartDate,
    course.csStudyEndDate,
    course.csOpenStartDate,
    course.csOpenEndDate,
    null,
    course.csTitlePath,
    null
  )));
}

// =============================================================================
// INTELLIGENT BATCH PROCESSING
// =============================================================================

/**
 * Process courses in intelligent batches with network awareness
 */
async function processCoursesIntelligently(courses, startTime) {
  const results = [];
  let completed = 0;
  let batchIndex = 0;

  console.log(`🚀 Processing ${courses.length} courses with intelligent batching`);

  // Start with small batches and adapt based on performance
  let currentBatchSize = NetworkState.currentConcurrency;

  for (let i = 0; i < courses.length; i += currentBatchSize) {
    const batch = courses.slice(i, i + currentBatchSize);
    batchIndex++;

    console.log(`📦 Batch ${batchIndex} (size: ${batch.length}, concurrency: ${NetworkState.currentConcurrency})`);

    const batchStartTime = Date.now();
    const batchPromises = batch.map(async (course, batchIdx) => {
      try {
        const courseIndex = i + batchIdx;
        const result = await processCourseResilient(course, courseIndex, courses.length);
        completed++;

        if (startTime) {
          estimatedProgressTime(completed, courses.length, startTime, '과정');
        }

        return { success: true, data: result, index: courseIndex };
      } catch (error) {
        console.error(`Failed to process course ${course.csCourseActiveSeq} (${course.csTitle}):`, error.message);
        completed++;

        if (startTime) {
          estimatedProgressTime(completed, courses.length, startTime, '과정');
        }

        // Return a minimal course object instead of failing completely
        const fallbackCourse = { ...course };
        fallbackCourse.csCmplTime = 0;
        fallbackCourse.csCmplList = [];

        return { success: false, data: fallbackCourse, error: error.message, index: i + batchIdx };
      }
    });

    // Wait for batch to complete
    const batchResults = await Promise.allSettled(batchPromises);
    const batchTime = Date.now() - batchStartTime;

    // Process results
    let successCount = 0;
    let failureCount = 0;

    batchResults.forEach(result => {
      if (result.status === 'fulfilled') {
        results.push(result.value.data);
        if (result.value.success) {
          successCount++;
        } else {
          failureCount++;
        }
      } else {
        console.error(`Batch promise failed:`, result.reason);
        failureCount++;
      }
    });

    console.log(`✅ Batch ${batchIndex} completed: ${successCount} success, ${failureCount} failures, ${batchTime}ms`);

    // Adapt batch size based on performance
    if (successCount === batch.length && batchTime < 10000) {
      // Increase batch size if all succeeded and was fast
      currentBatchSize = Math.min(currentBatchSize + 1, NetworkState.currentConcurrency + 2);
    } else if (failureCount > 0 || batchTime > 30000) {
      // Decrease batch size if there were failures or it was slow
      currentBatchSize = Math.max(1, currentBatchSize - 1);
    }

    // Adaptive delay between batches
    if (i + currentBatchSize < courses.length) {
      let delayTime = NetworkState.adaptiveBatchDelay;

      // Adjust delay based on recent performance
      const stats = CircuitBreaker.getStats();
      if (stats.errorRate > 0.1) {
        delayTime = Math.min(NETWORK_CONFIG.BATCH_DELAY_MAX, delayTime * 2);
      } else if (stats.errorRate < 0.05 && batchTime < 5000) {
        delayTime = Math.max(NETWORK_CONFIG.BATCH_DELAY_MIN, delayTime * 0.8);
      }

      NetworkState.adaptiveBatchDelay = delayTime;

      console.log(`⏳ Inter-batch delay: ${delayTime}ms`);
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }
  }

  const successCount = results.filter(r => r.csCmplTime !== undefined).length;
  const failureCount = results.length - successCount;

  console.log(`🎯 Processing complete: ${successCount} succeeded, ${failureCount} with fallback data`);

  return results;
}

/**
 * Process a single course with network resilience
 */
async function processCourseResilient(course, index, total) {
  console.debug(`🔄 Processing [${index + 1}/${total}] ${course.csTitle}`);

  try {
    // Get course metadata in parallel, but with small delays
    const classCountPromise = getCourseClassCountResilient(course.csCourseActiveSeq);

    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
    const examCountPromise = getCourseExamCountResilient(course);

    await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay
    const completionCountPromise = getCompletionCountResilient(course.csCourseActiveSeq);

    const [classCount, examCount, completionCount] = await Promise.all([
      classCountPromise,
      examCountPromise,
      completionCountPromise
    ]);

    console.debug(`📊 Course ${course.csCourseActiveSeq}: ${classCount} classes, ${examCount} exams, ${completionCount} completions`);

    course.csCmplTime = classCount + examCount;

    // Get completion details (this is usually the most expensive call)
    if (completionCount > 0) {
      const completions = await getCourseCompletionResilient(
        course.csCourseActiveSeq,
        course.csCourseMasterSeq,
        completionCount
      );
      course.csCmplList = completions;
    } else {
      course.csCmplList = [];
    }

    console.debug(`✅ Successfully processed course ${course.csCourseActiveSeq}`);
    return course;

  } catch (error) {
    console.error(`❌ Failed to process course ${course.csCourseActiveSeq}:`, error.message);
    throw error;
  }
}

// =============================================================================
// MAIN OPTIMIZED FUNCTIONS
// =============================================================================

/**
 * Network-resilient version of fetchCourses
 */
async function fetchCoursesResilient(action) {
  const startTime = Date.now();

  try {
    console.log('🚀 Starting network-resilient course fetching...');

    // Display current network configuration
    console.log(`🔧 Network Config: concurrency=${NetworkState.currentConcurrency}, timeout=${NETWORK_CONFIG.BASE_TIMEOUT}ms`);

    // Initialize health monitoring
    const healthChecker = setInterval(() => {
      const stats = CircuitBreaker.getStats();
      const avgResponseTime = RateLimiter.getAverageResponseTime();

      console.log(`📊 Health Check - Error rate: ${(stats.errorRate * 100).toFixed(1)}%, Avg response: ${avgResponseTime.toFixed(0)}ms, Active: ${NetworkState.activeConnections}, Concurrency: ${NetworkState.currentConcurrency}`);

      // Update health status
      if (stats.isOpen) {
        NetworkState.healthStatus = 'unhealthy';
      } else if (stats.errorRate > 0.2 || avgResponseTime > 20000) {
        NetworkState.healthStatus = 'degraded';
      } else {
        NetworkState.healthStatus = 'healthy';
      }
    }, NETWORK_CONFIG.HEALTH_CHECK_INTERVAL);

    // Step 1: Get course count and list
    console.log('📊 Fetching course count and list...');
    const totalCourseCount = await getTotalCourseCountResilient();
    console.log(`Found ${totalCourseCount} courses.`);

    const allCourses = await getCoursesResilient(totalCourseCount);
    console.log(`Fetched ${allCourses.length} course records.`);

    // Step 2: Determine courses to process (incremental update logic)
    let coursesToProcess = allCourses;
    let existingCourses = null;

    if (action === 'update') {
      try {
        existingCourses = await getData('courses');
        if (existingCourses && existingCourses.length > 0) {
          coursesToProcess = getCoursesToUpdate(allCourses, existingCourses);
          console.log(`📈 Incremental update: ${coursesToProcess.length} of ${allCourses.length} courses need processing`);
        }
      } catch (error) {
        console.warn('Could not load existing courses, processing all:', error.message);
        coursesToProcess = allCourses;
      }
    }

    if (coursesToProcess.length === 0) {
      console.log('✅ No courses need updating.');
      clearInterval(healthChecker);
      return existingCourses || [];
    }

    // Step 3: Process courses intelligently
    console.log(`🎯 Processing ${coursesToProcess.length} courses with network resilience...`);
    const processedCourses = await processCoursesIntelligently(coursesToProcess, startTime);

    // Step 4: Merge results for incremental updates
    let finalCourses = processedCourses;

    if (action === 'update' && existingCourses && existingCourses.length > 0) {
      console.log('🔄 Merging with existing data...');

      const processedMap = new Map(
        processedCourses.map(course => [course.csCourseActiveSeq, course])
      );

      finalCourses = existingCourses.map(existingCourse =>
        processedMap.get(existingCourse.csCourseActiveSeq) || existingCourse
      );

      // Add completely new courses
      processedCourses.forEach(course => {
        if (!existingCourses.some(existing => existing.csCourseActiveSeq === course.csCourseActiveSeq)) {
          finalCourses.push(course);
        }
      });
    }

    // Step 5: Save to database
    if (action === 'add') {
      console.log('💾 Adding courses to database...');
      await addData('courses', finalCourses);
    } else if (action === 'update') {
      console.log('💾 Updating courses in database...');
      await updateData('courses', finalCourses);
    }

    // Step 6: Performance summary
    clearInterval(healthChecker);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const stats = CircuitBreaker.getStats();
    const avgResponseTime = RateLimiter.getAverageResponseTime();

    console.log(`🎉 Processing complete!`);
    console.log(`⏱️  Total time: ${duration.toFixed(2)}s`);
    console.log(`📊 Final Stats:`);
    console.log(`   - Total requests: ${NetworkState.performanceMetrics.totalRequests}`);
    console.log(`   - Success rate: ${((1 - stats.errorRate) * 100).toFixed(1)}%`);
    console.log(`   - Avg response time: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`   - Final concurrency: ${NetworkState.currentConcurrency}`);
    console.log(`   - Cache size: ${apiCache.size} entries`);
    console.log(`   - Health status: ${NetworkState.healthStatus}`);

    return finalCourses;

  } catch (error) {
    console.error('❌ Network-resilient course fetching failed:', error);
    throw error;
  }
}

/**
 * Helper function to determine which courses need updating
 */
function getCoursesToUpdate(allCourses, existingCourses) {
  if (!existingCourses || existingCourses.length === 0) {
    return allCourses;
  }

  const existingMap = new Map(
    existingCourses.map(course => [course.csCourseActiveSeq, course])
  );

  return allCourses.filter(course => {
    const existing = existingMap.get(course.csCourseActiveSeq);
    if (!existing) return true; // New course

    // Check if course has changed
    return (
      course.csStatusCd !== existing.csStatusCd ||
      course.csStudyEndDate !== existing.csStudyEndDate ||
      course.csOpenEndDate !== existing.csOpenEndDate ||
      course.csCourseTypeCd !== existing.csCourseTypeCd
    );
  });
}

// =============================================================================
// PUBLIC API FUNCTIONS
// =============================================================================

/**
 * Network-resilient version of addCourses
 */
async function addCoursesResilient() {
  return await fetchCoursesResilient('add');
}

/**
 * Network-resilient version of updateCourses
 */
async function updateCoursesResilient() {
  return await fetchCoursesResilient('update');
}

// =============================================================================
// UTILITY AND MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Get network statistics
 */
function getNetworkStats() {
  const circuitStats = CircuitBreaker.getStats();
  const avgResponseTime = RateLimiter.getAverageResponseTime();

  return {
    circuitBreaker: {
      isOpen: circuitStats.isOpen,
      errorRate: circuitStats.errorRate,
      timeoutRate: circuitStats.timeoutRate,
      sampleSize: circuitStats.sampleSize
    },
    performance: {
      totalRequests: NetworkState.performanceMetrics.totalRequests,
      successfulRequests: NetworkState.performanceMetrics.successfulRequests,
      failedRequests: NetworkState.performanceMetrics.failedRequests,
      timeoutRequests: NetworkState.performanceMetrics.timeoutRequests,
      avgResponseTime: avgResponseTime
    },
    rateLimiting: {
      currentConcurrency: NetworkState.currentConcurrency,
      activeConnections: NetworkState.activeConnections,
      tokensAvailable: NetworkState.rateLimitTokens,
      healthStatus: NetworkState.healthStatus
    },
    cache: {
      size: apiCache.size,
      ttl: NETWORK_CONFIG.CACHE_TTL
    },
    adaptive: {
      batchDelay: NetworkState.adaptiveBatchDelay
    }
  };
}

/**
 * Reset network state (for testing or recovery)
 */
function resetNetworkState() {
  NetworkState.currentConcurrency = NETWORK_CONFIG.INITIAL_CONCURRENCY;
  NetworkState.circuitBreakerOpen = false;
  NetworkState.circuitBreakerOpenTime = 0;
  NetworkState.recentRequests = [];
  NetworkState.performanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    timeoutRequests: 0,
    avgResponseTime: 0,
    lastResponseTimes: []
  };
  NetworkState.activeConnections = 0;
  NetworkState.rateLimitTokens = NETWORK_CONFIG.MAX_CONCURRENCY;
  NetworkState.lastTokenRefill = Date.now();
  NetworkState.healthStatus = 'healthy';
  NetworkState.adaptiveBatchDelay = NETWORK_CONFIG.BATCH_DELAY_MIN;

  console.log('🔄 Network state reset');
}

/**
 * Clear API cache
 */
function clearApiCache() {
  const size = apiCache.size;
  apiCache.clear();
  console.log(`🧹 Cleared ${size} cache entries`);
}

/**
 * Update network configuration
 */
function updateNetworkConfig(newConfig) {
  Object.assign(NETWORK_CONFIG, newConfig);
  console.log('🔧 Updated network configuration:', NETWORK_CONFIG);
}

// =============================================================================
// BACKWARD COMPATIBILITY
// =============================================================================

// Legacy functions for backward compatibility
function getCompletionCount(csCourseActiveSeq) {
  return getCompletionCountResilient(csCourseActiveSeq);
}

function getCourseCompletion(csCourseActiveSeq, csCourseMasterSeq, count) {
  return getCourseCompletionResilient(csCourseActiveSeq, csCourseMasterSeq, count);
}

function getCourseClassCount(csCourseActiveSeq) {
  return getCourseClassCountResilient(csCourseActiveSeq);
}

function getCourseExamCount(course) {
  return getCourseExamCountResilient(course);
}

function getTotalCourseCount() {
  return getTotalCourseCountResilient();
}

function getCourses(count = 10) {
  return getCoursesResilient(count);
}

async function fetchCourses(action) {
  return await fetchCoursesResilient(action);
}

async function addCourses() {
  return await addCoursesResilient();
}

/**
 * Utility functions that remain unchanged
 */
function isCustomCourse(course, keyword) {
  return course.csTitle.includes(keyword) && course.csTitlePath === '맞춤형';
}

async function searchCustomCourses(input = '', year = new Date().getFullYear()) {
  const exist = await getData('courses');
  if (!exist) {
    await addCoursesResilient();
  }
  const courses = await getData('courses');
  customTable(courses);
  console.log(`Found ${courses.length} courses in the database.`);

  const keywords = input.split(' ');
  const results = [];
  for (const course of courses) {
    for (const keyword of keywords) {
      if (isCustomCourse(course, keyword) && course.csYear === year) {
        results.push(course);
        break;
      }
    }
  }

  customTable(results);
  console.log(`Found ${results.length} courses that match the search criteria.`);
  return results;
}

export async function searchCourses(input = '', year = new Date().getFullYear()) {
  const exist = await getData('courses');
  if (!exist) {
    await addCoursesResilient();
  }
  const courses = await getData('courses');

  const keywords = input.split(' ');
  const results = [];
  for (const course of courses) {
    for (const keyword of keywords) {
      if (course.csTitle.includes(keyword) && course.csYear >= year) {
        results.push(course);
        break;
      }
    }
  }

  return results;
}

// Export the network-resilient function as the main updateCourses function
export const updateCourses = updateCoursesResilient;

// Export utility functions
export {
  getNetworkStats,
  resetNetworkState,
  clearApiCache,
  updateNetworkConfig,
  NETWORK_CONFIG
};