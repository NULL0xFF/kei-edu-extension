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
// OPTIMIZATION UTILITIES
// =============================================================================

/**
 * Global cache for API responses to avoid duplicate requests
 */
const apiCache = new Map();

/**
 * Configuration for optimization settings
 */
const OPTIMIZATION_CONFIG = {
  CONCURRENCY_LIMIT: 5, // Number of concurrent API calls
  RETRY_ATTEMPTS: 3, // Number of retry attempts for failed calls
  BATCH_DELAY: 100, // Delay between batches in milliseconds
  CACHE_TTL: 5 * 60 * 1000, // Cache TTL in milliseconds (5 minutes)
  INCREMENTAL_UPDATE_ENABLED: true // Enable incremental updates
};

/**
 * Enhanced API call with retry logic and exponential backoff
 * @param {Function} apiFunction - The API function to call
 * @param {Array} args - Arguments to pass to the API function
 * @param {number} maxRetries - Maximum number of retries
 * @returns {Promise} - Promise resolving to the API response
 */
async function apiCallWithRetry(apiFunction, args = [], maxRetries = OPTIMIZATION_CONFIG.RETRY_ATTEMPTS) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiFunction(...args);
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`API call failed after ${maxRetries + 1} attempts:`, error);
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s delays
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms...`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Cached API call to avoid duplicate requests
 * @param {string} cacheKey - Unique key for caching
 * @param {Function} apiFunction - The API function to call
 * @param {Array} args - Arguments to pass to the API function
 * @returns {Promise} - Promise resolving to the API response
 */
async function cachedApiCall(cacheKey, apiFunction, args = []) {
  // Check if result is in cache and not expired
  if (apiCache.has(cacheKey)) {
    const cachedResult = apiCache.get(cacheKey);
    const now = Date.now();

    if (now - cachedResult.timestamp < OPTIMIZATION_CONFIG.CACHE_TTL) {
      console.debug(`Cache hit for key: ${cacheKey}`);
      return cachedResult.data;
    } else {
      // Remove expired cache entry
      apiCache.delete(cacheKey);
    }
  }

  console.debug(`Cache miss for key: ${cacheKey}, making API call`);
  const result = await apiCallWithRetry(apiFunction, args);

  // Store result in cache with timestamp
  apiCache.set(cacheKey, {
    data: result,
    timestamp: Date.now()
  });

  return result;
}

/**
 * Process items in parallel batches with concurrency control
 * @param {Array} items - Items to process
 * @param {number} concurrencyLimit - Maximum number of concurrent operations
 * @param {Function} processor - Function to process each item
 * @param {number} startTime - Start time for progress tracking
 * @returns {Promise<Array>} - Promise resolving to processed results
 */
async function processInBatches(items, concurrencyLimit, processor, startTime) {
  const results = [];
  let completed = 0;

  console.log(`Processing ${items.length} items in batches of ${concurrencyLimit}`);

  for (let i = 0; i < items.length; i += concurrencyLimit) {
    const batch = items.slice(i, i + concurrencyLimit);
    console.debug(`Processing batch ${Math.floor(i / concurrencyLimit) + 1}/${Math.ceil(items.length / concurrencyLimit)}`);

    const batchPromises = batch.map(async (item, batchIndex) => {
      try {
        const result = await processor(item, i + batchIndex, items.length);
        completed++;

        // Update progress
        if (startTime) {
          estimatedProgressTime(completed, items.length, startTime, '과정');
        }

        return { success: true, data: result, index: i + batchIndex };
      } catch (error) {
        console.error(`Failed to process item ${i + batchIndex} (${item.csTitle || item.csCourseActiveSeq}):`, error);
        completed++;

        // Update progress even for failed items
        if (startTime) {
          estimatedProgressTime(completed, items.length, startTime, '과정');
        }

        return { success: false, error: error, index: i + batchIndex, item };
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);

    // Process batch results
    batchResults.forEach((result, batchIndex) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          results.push(result.value.data);
        } else {
          console.warn(`Item ${result.value.index} failed:`, result.value.error.message);
        }
      } else {
        console.error(`Batch processing failed for item ${i + batchIndex}:`, result.reason);
      }
    });

    // Add delay between batches to be server-friendly
    if (i + concurrencyLimit < items.length && OPTIMIZATION_CONFIG.BATCH_DELAY > 0) {
      await new Promise(resolve => setTimeout(resolve, OPTIMIZATION_CONFIG.BATCH_DELAY));
    }
  }

  const successCount = results.length;
  const failureCount = items.length - successCount;

  if (failureCount > 0) {
    console.warn(`Batch processing completed: ${successCount} succeeded, ${failureCount} failed`);
  } else {
    console.log(`Batch processing completed successfully: ${successCount} items processed`);
  }

  return results;
}

/**
 * Check if a course has changed compared to existing data
 * @param {Course} newCourse - New course data
 * @param {Course} existingCourse - Existing course data
 * @returns {boolean} - True if course has changed
 */
function hasChanged(newCourse, existingCourse) {
  const fieldsToCheck = [
    'csStatusCd',
    'csStudyEndDate',
    'csOpenEndDate',
    'csCourseTypeCd'
  ];

  return fieldsToCheck.some(field =>
    newCourse[field] !== existingCourse[field]
  );
}

/**
 * Get courses that need to be updated
 * @param {Array} allCourses - All courses from API
 * @param {Array} existingCourses - Existing courses from database
 * @returns {Array} - Courses that need to be updated
 */
function getCoursesToUpdate(allCourses, existingCourses) {
  if (!OPTIMIZATION_CONFIG.INCREMENTAL_UPDATE_ENABLED || !existingCourses || existingCourses.length === 0) {
    return allCourses;
  }

  const existingMap = new Map(
    existingCourses.map(course => [course.csCourseActiveSeq, course])
  );

  const coursesToUpdate = allCourses.filter(course => {
    const existing = existingMap.get(course.csCourseActiveSeq);
    return !existing || hasChanged(course, existing);
  });

  console.log(`Incremental update: ${coursesToUpdate.length} of ${allCourses.length} courses need updating`);
  return coursesToUpdate;
}

// =============================================================================
// OPTIMIZED API FUNCTIONS
// =============================================================================

/**
 * Optimized version of getCompletionCount with caching and retry logic
 * @function getCompletionCountOptimized
 * @param {string} csCourseActiveSeq - The course active sequence.
 * @returns {Promise<number>} - The total number of completion records.
 */
async function getCompletionCountOptimized(csCourseActiveSeq) {
  const cacheKey = `completion_count_${csCourseActiveSeq}`;

  const apiCall = () => new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true
      },
      url: "/course/cmpl/selectCmplList.do",
      type: "post",
      data: new CompletionRequest(csCourseActiveSeq),
      dataType: "json",
      timeout: 30000, // 30 second timeout
      success: function (data) {
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        reject(new Error(`Failed to get completion count: ${error} (${status})`));
      }
    });
  });

  return await cachedApiCall(cacheKey, apiCall);
}

/**
 * Optimized version of getCourseClassCount with caching and retry logic
 * @function getCourseClassCountOptimized
 * @param {string} csCourseActiveSeq - The course active sequence.
 * @returns {Promise<number>} - The total number of course classes.
 */
async function getCourseClassCountOptimized(csCourseActiveSeq) {
  const cacheKey = `class_count_${csCourseActiveSeq}`;

  const apiCall = () => new Promise((resolve, reject) => {
    const request = {
      csCourseActiveSeq: csCourseActiveSeq,
      csReferenceTypeCd: 'organization',
      dspMenuId: 'MG0005',
      dspLinkMenuId: 'MG0005'
    };

    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true
      },
      url: "/course/active/selectAtiveElementList.do",
      type: "post",
      data: request,
      dataType: "json",
      timeout: 30000,
      success: function (data) {
        resolve(data.list.length);
      },
      error: function (xhr, status, error) {
        reject(new Error(`Failed to get class count: ${error} (${status})`));
      }
    });
  });

  return await cachedApiCall(cacheKey, apiCall);
}

/**
 * Optimized version of getCourseExamCount with caching and retry logic
 * @function getCourseExamCountOptimized
 * @param {Course} course - The course.
 * @returns {Promise<number>} - The total number of exams.
 */
async function getCourseExamCountOptimized(course) {
  const cacheKey = `exam_count_${course.csCourseActiveSeq}`;

  const apiCall = () => new Promise((resolve, reject) => {
    const request = {
      csCourseActiveSeq: course.csCourseActiveSeq,
      csReferenceTypeCd: 'exam',
      dspMenuId: 'MG0005',
      dspLinkMenuId: 'MG0005'
    };

    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true
      },
      url: "/course/active/selectAtiveElementList.do",
      type: "post",
      data: request,
      dataType: "json",
      timeout: 30000,
      success: function (data) {
        resolve(data.list.length);
      },
      error: function (xhr, status, error) {
        reject(new Error(`Failed to get exam count: ${error} (${status})`));
      }
    });
  });

  return await cachedApiCall(cacheKey, apiCall);
}

/**
 * Optimized version of getCourseCompletion with retry logic
 * @function getCourseCompletionOptimized
 * @param {string} csCourseActiveSeq - The course active sequence.
 * @param {string} csCourseMasterSeq - The course master sequence.
 * @param {number} count - The number of completion records to return.
 * @returns {Promise<Completion[]>} - The completion records.
 */
async function getCourseCompletionOptimized(csCourseActiveSeq, csCourseMasterSeq, count) {
  // Function to fetch the completion list
  const fetchCompletionList = () => new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true
      },
      url: "/course/cmpl/selectCmplList.do",
      type: "post",
      data: new CompletionRequest(Number(csCourseActiveSeq), count),
      dataType: "json",
      timeout: 60000, // Longer timeout for completion data
      success: function (data) {
        resolve(data.list.map(completion => ({
          csMemberSeq: completion.csMemberSeq,
          csMemberId: completion.csMemberId,
          csMemberName: completion.csMemberName,
          cxMemberEmail: completion.cxMemberEmail,
          csApplyStatusCd: completion.csApplyStatusCd,
          csStudyStartDate: '',
          csCompletionYn: completion.csCompletionYn,
          cxCompletionDate: completion.cxCompletionDate
        })));
      },
      error: function (xhr, status, error) {
        reject(new Error(`Failed to fetch completion list: ${error} (${status})`));
      }
    });
  });

  // Function to fetch the study start dates
  const fetchStudyStartDates = () => new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true
      },
      url: "/course/apply/selectApplyList.do",
      type: "post",
      data: new ApplicationRequest(Number(csCourseActiveSeq), Number(csCourseMasterSeq), count),
      dataType: "json",
      timeout: 60000,
      success: function (data) {
        const startDateMap = new Map();
        data.list.forEach(apply => {
          startDateMap.set(apply.csMemberSeq, apply.csStudyStartDate);
        });
        resolve(startDateMap);
      },
      error: function (xhr, status, error) {
        reject(new Error(`Failed to fetch study start dates: ${error} (${status})`));
      }
    });
  });

  try {
    // Run both API calls in parallel with retry logic
    const [completionList, startDateMap] = await Promise.all([
      apiCallWithRetry(fetchCompletionList),
      apiCallWithRetry(fetchStudyStartDates)
    ]);

    // Combine the results
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
 * Process a single course with optimized API calls
 * @param {Course} course - The course to process
 * @param {number} index - Current course index
 * @param {number} total - Total number of courses
 * @returns {Promise<Course>} - The processed course
 */
async function processCourseOptimized(course, index, total) {
  console.debug(`Processing course [${index + 1}/${total}] ${course.csYear} ${course.csTitle}...`);

  try {
    // Parallel API calls for course metadata
    const [classCount, examCount, completionCount] = await Promise.all([
      getCourseClassCountOptimized(course.csCourseActiveSeq),
      getCourseExamCountOptimized(course),
      getCompletionCountOptimized(course.csCourseActiveSeq)
    ]);

    console.debug(`Course ${course.csCourseActiveSeq}: ${classCount} classes, ${examCount} exams, ${completionCount} completions`);

    course.csCmplTime = classCount + examCount;

    // Fetch completion details
    const completions = await getCourseCompletionOptimized(
      course.csCourseActiveSeq,
      course.csCourseMasterSeq,
      completionCount
    );

    course.csCmplList = completions;

    console.debug(`Successfully processed course ${course.csCourseActiveSeq} with ${completions.length} completions`);
    return course;

  } catch (error) {
    console.error(`Failed to process course ${course.csCourseActiveSeq} (${course.csTitle}):`, error);
    // Return course with minimal data rather than failing completely
    course.csCmplTime = 0;
    course.csCmplList = [];
    return course;
  }
}

// =============================================================================
// MAIN OPTIMIZED FUNCTIONS
// =============================================================================

/**
 * Optimized version of getTotalCourseCount
 */
async function getTotalCourseCountOptimized() {
  const apiCall = () => new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true
      },
      url: "/course/active/selectActiveOperList.do",
      type: "post",
      data: new CourseRequest(),
      dataType: "json",
      timeout: 30000,
      success: function (data) {
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        reject(new Error(`Failed to fetch course count: ${error} (${status})`));
      }
    });
  });

  return await apiCallWithRetry(apiCall);
}

/**
 * Optimized version of getCourses
 */
async function getCoursesOptimized(count = 10) {
  const apiCall = () => new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true
      },
      url: "/course/active/selectActiveOperList.do",
      type: "post",
      data: new CourseRequest(count),
      dataType: "json",
      timeout: 60000,
      success: function (data) {
        resolve(data.list.map(course => new Course(
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
      },
      error: function (xhr, status, error) {
        reject(new Error(`Failed to fetch courses: ${error} (${status})`));
      }
    });
  });

  return await apiCallWithRetry(apiCall);
}

/**
 * Optimized version of fetchCourses with parallel processing and caching
 * @function fetchCoursesOptimized
 * @param {string} action - The action to perform on the courses.
 * @returns {Promise<Course[]>} - The courses.
 */
async function fetchCoursesOptimized(action) {
  const startTime = Date.now();

  try {
    console.log('🚀 Starting optimized course fetching...');
    console.log(`Configuration: Concurrency=${OPTIMIZATION_CONFIG.CONCURRENCY_LIMIT}, Retries=${OPTIMIZATION_CONFIG.RETRY_ATTEMPTS}, Incremental=${OPTIMIZATION_CONFIG.INCREMENTAL_UPDATE_ENABLED}`);

    // Step 1: Get total course count and course list
    console.log('📊 Fetching course count and list...');
    const totalCourseCount = await getTotalCourseCountOptimized();
    console.log(`Found ${totalCourseCount} courses.`);

    const allCourses = await getCoursesOptimized(totalCourseCount);
    console.log(`Fetched ${allCourses.length} course records.`);

    // Step 2: Determine which courses need updating (for incremental updates)
    let coursesToProcess = allCourses;
    let existingCourses = null;

    if (action === 'update' && OPTIMIZATION_CONFIG.INCREMENTAL_UPDATE_ENABLED) {
      try {
        existingCourses = await getData('courses');
        coursesToProcess = getCoursesToUpdate(allCourses, existingCourses);
      } catch (error) {
        console.warn('Could not load existing courses for incremental update, processing all courses:', error.message);
        coursesToProcess = allCourses;
      }
    }

    if (coursesToProcess.length === 0) {
      console.log('✅ No courses need updating.');
      return existingCourses || [];
    }

    console.log(`📚 Processing ${coursesToProcess.length} courses in parallel batches...`);

    // Step 3: Process courses in parallel batches
    const processedCourses = await processInBatches(
      coursesToProcess,
      OPTIMIZATION_CONFIG.CONCURRENCY_LIMIT,
      processCourseOptimized,
      startTime
    );

    console.log(`✅ Successfully processed ${processedCourses.length} courses.`);

    // Step 4: Merge with existing data for incremental updates
    let finalCourses = processedCourses;

    if (action === 'update' && existingCourses && OPTIMIZATION_CONFIG.INCREMENTAL_UPDATE_ENABLED) {
      console.log('🔄 Merging with existing course data...');

      const processedMap = new Map(
        processedCourses.map(course => [course.csCourseActiveSeq, course])
      );

      finalCourses = existingCourses.map(existingCourse =>
        processedMap.get(existingCourse.csCourseActiveSeq) || existingCourse
      );

      // Add any completely new courses
      processedCourses.forEach(course => {
        if (!existingCourses.some(existing => existing.csCourseActiveSeq === course.csCourseActiveSeq)) {
          finalCourses.push(course);
        }
      });

      console.log(`Merged data: ${finalCourses.length} total courses.`);
    }

    // Step 5: Save to database
    if (action === 'add') {
      console.log('💾 Adding courses to database...');
      await addData('courses', finalCourses);
      console.log(`Successfully added ${finalCourses.length} courses to database.`);
    } else if (action === 'update') {
      console.log('💾 Updating courses in database...');
      await updateData('courses', finalCourses);
      console.log(`Successfully updated ${finalCourses.length} courses in database.`);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    // Step 6: Performance summary
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const avgTime = duration / coursesToProcess.length;

    console.log(`🎉 Optimization complete!`);
    console.log(`⏱️  Total time: ${duration.toFixed(2)}s`);
    console.log(`📈 Average time per course: ${avgTime.toFixed(3)}s`);
    console.log(`🗂️  Cache size: ${apiCache.size} entries`);

    return finalCourses;

  } catch (error) {
    console.error('❌ Failed to fetch courses:', error);
    throw error;
  } finally {
    // Clean up old cache entries periodically
    if (apiCache.size > 1000) {
      console.log('🧹 Cleaning up old cache entries...');
      const now = Date.now();
      let cleanedCount = 0;

      for (const [key, value] of apiCache.entries()) {
        if (now - value.timestamp > OPTIMIZATION_CONFIG.CACHE_TTL) {
          apiCache.delete(key);
          cleanedCount++;
        }
      }

      console.log(`Cleaned ${cleanedCount} expired cache entries.`);
    }
  }
}

/**
 * Optimized version of addCourses
 * @function addCoursesOptimized
 * @returns {Promise<Course[]>} - The courses.
 */
async function addCoursesOptimized() {
  return await fetchCoursesOptimized('add');
}

/**
 * Optimized version of updateCourses
 * @function updateCoursesOptimized
 * @returns {Promise<Course[]>} - The courses.
 */
async function updateCoursesOptimized() {
  return await fetchCoursesOptimized('update');
}

// =============================================================================
// BACKWARD COMPATIBILITY AND UTILITY FUNCTIONS
// =============================================================================

/**
 * Legacy functions maintained for backward compatibility
 */
function getCompletionCount(csCourseActiveSeq) {
  return getCompletionCountOptimized(csCourseActiveSeq);
}

function getCourseCompletion(csCourseActiveSeq, csCourseMasterSeq, count) {
  return getCourseCompletionOptimized(csCourseActiveSeq, csCourseMasterSeq, count);
}

function getCourseClassCount(csCourseActiveSeq) {
  return getCourseClassCountOptimized(csCourseActiveSeq);
}

function getCourseExamCount(course) {
  return getCourseExamCountOptimized(course);
}

function getTotalCourseCount() {
  return getTotalCourseCountOptimized();
}

function getCourses(count = 10) {
  return getCoursesOptimized(count);
}

async function fetchCourses(action) {
  return await fetchCoursesOptimized(action);
}

async function addCourses() {
  return await addCoursesOptimized();
}

/**
 * Cache management utilities
 */
function clearApiCache() {
  const size = apiCache.size;
  apiCache.clear();
  console.log(`Cleared ${size} cache entries.`);
}

function getCacheStats() {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;

  for (const [key, value] of apiCache.entries()) {
    if (now - value.timestamp < OPTIMIZATION_CONFIG.CACHE_TTL) {
      validEntries++;
    } else {
      expiredEntries++;
    }
  }

  return {
    total: apiCache.size,
    valid: validEntries,
    expired: expiredEntries,
    cacheHitRate: '(not tracked)'
  };
}

function updateOptimizationConfig(newConfig) {
  Object.assign(OPTIMIZATION_CONFIG, newConfig);
  console.log('Updated optimization configuration:', OPTIMIZATION_CONFIG);
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
    await addCoursesOptimized();
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
    await addCoursesOptimized();
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

// Export the optimized function as the main updateCourses function
export const updateCourses = updateCoursesOptimized;

// Export utility functions for advanced users
export {
  clearApiCache,
  getCacheStats,
  updateOptimizationConfig,
  OPTIMIZATION_CONFIG
};