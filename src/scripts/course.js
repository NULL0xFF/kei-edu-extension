import * as jQuery from 'jquery';
import { customTable, getCSRFToken } from './shared.js';
import { addData, getData, updateData } from "./storage";
import { estimatedProgressTime } from "./solution";

/**
 * Request pool manager for controlling concurrent API requests
 * (Available for future throttling; current batching handles most cases)
 */
class RequestPool {
  constructor(maxConcurrent = 10) {
    this.maxConcurrent = maxConcurrent;
    this.activeRequests = 0;
    this.queue = [];
    this.results = new Map();
    this.errors = new Map();
    this.completed = 0;
    this.total = 0;
  }

  async execute(id, requestFn) {
    return new Promise((resolve, reject) => {
      const runRequest = async () => {
        this.activeRequests++;
        try {
          const result = await requestFn();
          this.results.set(id, result);
          this.completed++;
          resolve(result);
        } catch (error) {
          this.errors.set(id, error);
          this.completed++;
          reject(error);
        } finally {
          this.activeRequests--;
          this.processQueue();
        }
      };

      if (this.activeRequests < this.maxConcurrent) {
        runRequest();
      } else {
        this.queue.push(runRequest);
      }
    });
  }

  processQueue() {
    if (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const nextRequest = this.queue.shift();
      nextRequest();
    }
  }

  getProgress() {
    return {
      completed: this.completed,
      total: this.total,
      percentage: this.total > 0 ? (this.completed / this.total * 100).toFixed(2) : 0,
      errors: this.errors.size
    };
  }
}

/**
 * Batch processor for handling large datasets
 */
class BatchProcessor {
  constructor(batchSize = 50, delayBetweenBatches = 1000) {
    this.batchSize = batchSize;
    this.delayBetweenBatches = delayBetweenBatches;
    this.progressCallback = null;
  }

  async processBatches(items, processor) {
    const batches = [];
    for (let i = 0; i < items.length; i += this.batchSize) {
      batches.push(items.slice(i, i + this.batchSize));
    }

    const results = [];
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = await Promise.allSettled(
        batch.map(item => processor(item))
      );

      results.push(...batchResults);

      if (this.progressCallback) {
        this.progressCallback({
          currentBatch: i + 1,
          totalBatches: batches.length,
          itemsProcessed: Math.min((i + 1) * this.batchSize, items.length),
          totalItems: items.length
        });
      }

      if (i < batches.length - 1) {
        await this.delay(this.delayBetweenBatches);
      }
    }

    return results;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  onProgress(callback) {
    this.progressCallback = callback;
  }
}

/**
 * Enhanced AJAX request with retry and timeout
 */
function ajaxRequest(url, data, options = {}) {
  const defaults = {
    maxRetries: 3,
    timeout: 30000,
    retryDelay: 1000
  };

  const settings = { ...defaults, ...options };

  return new Promise((resolve, reject) => {
    let attempts = 0;

    const makeRequest = () => {
      attempts++;

      jQuery.ajax({
        headers: { 'X-CSRF-TOKEN': getCSRFToken() },
        xhrFields: { withCredentials: true },
        url: url,
        type: "post",
        data: data,
        dataType: "json",
        timeout: settings.timeout,
        success: function (response) {
          resolve(response);
        },
        error: function (xhr, status, error) {
          if (attempts < settings.maxRetries) {
            console.warn(`Request failed (attempt ${attempts}/${settings.maxRetries}): ${url}`);
            setTimeout(makeRequest, settings.retryDelay * attempts);
          } else {
            console.error(`Request failed after ${settings.maxRetries} attempts: ${url}`);
            reject({ xhr, status, error, url, data });
          }
        }
      });
    };

    makeRequest();
  });
}

/**
 * Data model classes (unchanged shapes for server compatibility)
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

  formatCompletionDate(cxCompletionDate) {
    if (cxCompletionDate === null) return null;

    const timezoneOffset = new Date().getTimezoneOffset() * 60000;

    const year = cxCompletionDate.substring(0, 4);
    const month = cxCompletionDate.substring(4, 6);
    const day = cxCompletionDate.substring(6, 8);
    const hour = cxCompletionDate.substring(8, 10);
    const minute = cxCompletionDate.substring(10, 12);
    const second = cxCompletionDate.substring(12, 14);

    return new Date(
      Date.UTC(year, month - 1, day, hour, minute, second) + timezoneOffset
    );
  }
}

class CompletionRequest {
  static MENU_ID = 'MG0036';
  static Order = {
    MEMBER_ASC: 1,
    MEMBER_DESC: -1,
    END_DATE_ASC: 4,
    END_DATE_DESC: -4
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

class ApplicationRequest {
  static MENU_ID = 'MG0028';

  constructor(courseActiveSeq = 0, courseMasterSeq = 0, count = 10) {
    this.pageIndex = 1;
    this.searchListCnt = count;
    this.dspLinkMenuId = this.constructor.MENU_ID;
    this.dspMenuId = this.constructor.MENU_ID;
    this.searchCsCourseActiveSeq = courseActiveSeq;
    this.searchCsCourseMasterSeq = courseMasterSeq;
    this.searchCsApplyStatusCd = '';
    this.searchCxDivisionCd = '';
    this.searchCsMemberId = '';
    this.searchCsMemberName = '';
  }
}

class Course {
  static Status = { ACTIVE: 'active', INACTIVE: 'inactive' }
  static Type = { ALWAYS: 'always', PERIOD: 'period' }
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
    this.csCourseActiveSeq = csCourseActiveSeq;
    this.csCourseMasterSeq = csCourseMasterSeq;
    this.csTitle = csTitle;
    this.csStatusCd = csStatusCd;
    this.csCourseTypeCd = csCourseTypeCd;
    this.csYear = csYear;
    this.csApplyStartDate = csApplyStartDate;
    this.csApplyEndDate = csApplyEndDate;
    this.csStudyStartDate = csStudyStartDate;
    this.csStudyEndDate = csStudyEndDate;
    this.csOpenStartDate = csOpenStartDate;
    this.csOpenEndDate = csOpenEndDate;
    this.csCmplTime = csCmplTime;
    this.csTitlePath = csTitlePath;
    this.csCmplList = csCmplList;
  }
}

class CourseRequest {
  static Order = {
    TITLE_ASC: 1,
    TITLE_DESC: -1,
    CATEGORY_ASC: 2,
    CATEGORY_DESC: -2,
    STATUS_ASC: 3,
    STATUS_DESC: -3,
    DATE_ASC: 4,
    DATE_DESC: -4
  }
  static Category = {
    ALL: '',
    INTRO: '1',
    ADVANCED: '2',
    GENERAL: '3',
    CUSTOMIZED: '14',
    FOREIGN: '16'
  }
  static Type = {
    ALL: '',
    ALWAYS: 'always',
    PERIOD: 'period'
  }
  static Status = {
    ALL: '',
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  }

  constructor(count = 10, search = '', year = '') {
    this.pageIndex = 1;
    this.searchListCnt = count;
    this.orderBy = this.constructor.Order.DATE_DESC;
    this.dspLinkMenuId = 'MG0027';
    this.dspMenuId = 'MG0027';
    this.searchCsCategorySeq = this.constructor.Category.ALL;
    this.searchCsSubjectCode = '';
    this.searchCsYear = year;
    this.searchCsCourseTypeCd = this.constructor.Type.ALL;
    this.searchCsStatusCd = this.constructor.Status.ALL;
    this.searchCsTitle = search;
  }
}

/**
 * Optimized course data fetcher with parallel processing + cache
 */
class CourseDataFetcher {
  constructor(options = {}) {
    this.options = {
      maxConcurrent: options.maxConcurrent || 10,
      batchSize: options.batchSize || 50,
      delayBetweenBatches: options.delayBetweenBatches || 2000,
      enableCache: options.enableCache !== false,
      cacheExpiry: options.cacheExpiry || 3600000, // 1 hour
      ...options
    };

    this.requestPool = new RequestPool(this.options.maxConcurrent);
    this.batchProcessor = new BatchProcessor(
      this.options.batchSize,
      this.options.delayBetweenBatches
    );
    this.cache = new Map();
    this.stats = {
      startTime: null,
      endTime: null,
      totalRequests: 0,
      failedRequests: 0,
      cachedResponses: 0
    };
  }

  isCacheValid(cacheEntry) {
    if (!this.options.enableCache || !cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < this.options.cacheExpiry;
  }

  async getWithCache(key, fetchFn) {
    const cached = this.cache.get(key);
    if (this.isCacheValid(cached)) {
      this.stats.cachedResponses++;
      return cached.data;
    }

    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }

  async fetchCourseDetails(course) {
    const courseKey = course.csCourseActiveSeq;

    try {
      const [classCount, examCount, completionCount] = await Promise.all([
        this.getWithCache(`class_${courseKey}`, () =>
          this.getCourseClassCount(course.csCourseActiveSeq)
        ),
        this.getWithCache(`exam_${courseKey}`, () =>
          this.getCourseExamCount(course)
        ),
        this.getWithCache(`completion_count_${courseKey}`, () =>
          this.getCompletionCount(course.csCourseActiveSeq)
        )
      ]);

      course.csCmplTime = classCount + examCount;

      if (completionCount > 0) {
        const completions = await this.getWithCache(`completions_${courseKey}`, () =>
          this.getCourseCompletion(
            course.csCourseActiveSeq,
            course.csCourseMasterSeq,
            completionCount
          )
        );
        course.csCmplList = completions;
      } else {
        course.csCmplList = [];
      }

      return course;
    } catch (error) {
      console.error(`Failed to fetch details for course ${course.csTitle}:`, error);
      course.csCmplTime = course.csCmplTime || 0;
      course.csCmplList = course.csCmplList || [];
      throw error;
    }
  }

  async getCourseClassCount(csCourseActiveSeq) {
    const request = {
      csCourseActiveSeq: csCourseActiveSeq,
      csReferenceTypeCd: 'organization',
      dspMenuId: 'MG0005',
      dspLinkMenuId: 'MG0005'
    };

    this.stats.totalRequests++;
    const data = await ajaxRequest("/course/active/selectAtiveElementList.do", request);
    return data.list.length;
  }

  async getCourseExamCount(course) {
    const request = {
      csCourseActiveSeq: course.csCourseActiveSeq,
      csReferenceTypeCd: 'exam',
      dspMenuId: 'MG0005',
      dspLinkMenuId: 'MG0005'
    };

    this.stats.totalRequests++;
    const data = await ajaxRequest("/course/active/selectAtiveElementList.do", request);
    return data.list.length;
  }

  async getCompletionCount(csCourseActiveSeq) {
    this.stats.totalRequests++;
    const data = await ajaxRequest(
      "/course/cmpl/selectCmplList.do",
      new CompletionRequest(csCourseActiveSeq)
    );
    return data.cnt;
  }

  async getCourseCompletion(csCourseActiveSeq, csCourseMasterSeq, count) {
    const [completionList, startDateMap] = await Promise.all([
      this.fetchCompletionList(csCourseActiveSeq, count),
      this.fetchStudyStartDates(csCourseActiveSeq, csCourseMasterSeq, count)
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
  }

  async fetchCompletionList(csCourseActiveSeq, count) {
    this.stats.totalRequests++;
    const data = await ajaxRequest(
      "/course/cmpl/selectCmplList.do",
      new CompletionRequest(Number(csCourseActiveSeq), count)
    );

    return data.list.map(completion => ({
      csMemberSeq: completion.csMemberSeq,
      csMemberId: completion.csMemberId,
      csMemberName: completion.csMemberName,
      cxMemberEmail: completion.cxMemberEmail,
      csApplyStatusCd: completion.csApplyStatusCd,
      csStudyStartDate: '',
      csCompletionYn: completion.csCompletionYn,
      cxCompletionDate: completion.cxCompletionDate
    }));
  }

  async fetchStudyStartDates(csCourseActiveSeq, csCourseMasterSeq, count) {
    this.stats.totalRequests++;
    const data = await ajaxRequest(
      "/course/apply/selectApplyList.do",
      new ApplicationRequest(
        Number(csCourseActiveSeq),
        Number(csCourseMasterSeq),
        count
      )
    );

    const startDateMap = new Map();
    data.list.forEach(apply => {
      startDateMap.set(apply.csMemberSeq, apply.csStudyStartDate);
    });
    return startDateMap;
  }

  async processAllCourses(courses, progressCallback) {
    this.stats.startTime = Date.now();

    const results = [];
    const errors = [];

    this.batchProcessor.onProgress((progress) => {
      if (progressCallback) {
        const elapsed = Date.now() - this.stats.startTime;
        const avgTimePerItem = Math.max(1, elapsed / Math.max(1, progress.itemsProcessed));
        const estimatedRemaining = avgTimePerItem * (progress.totalItems - progress.itemsProcessed);

        progressCallback({
          ...progress,
          elapsed,
          estimatedRemaining,
          estimatedTotal: elapsed + estimatedRemaining,
          stats: this.stats
        });
      }
    });

    const batchResults = await this.batchProcessor.processBatches(
      courses,
      course => this.fetchCourseDetails(course).catch(error => {
        this.stats.failedRequests++;
        return { course, error };
      })
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const value = result.value;
        if (value && value.error) {
          errors.push({ course: courses[index], error: value.error });
        } else {
          results.push(value);
        }
      } else {
        errors.push({ course: courses[index], error: result.reason });
      }
    });

    this.stats.endTime = Date.now();

    return {
      courses: results,
      errors,
      stats: {
        ...this.stats,
        duration: this.stats.endTime - this.stats.startTime,
        successRate: ((results.length / courses.length) * 100).toFixed(2)
      }
    };
  }
}

/* ------------------------------------------------------------------ */
/* Restored helpers from v1, rewritten to use ajaxRequest (robust)    */
/* ------------------------------------------------------------------ */

/**
 * Fetches the total number of courses from the server.
 * @returns {Promise<number>}
 */
async function getTotalCourseCount() {
  const data = await ajaxRequest(
    "/course/active/selectActiveOperList.do",
    new CourseRequest()
  );
  return data.cnt;
}

/**
 * Fetches the courses from the server.
 * @param {number} count
 * @returns {Promise<Course[]>}
 */
async function getCourses(count = 10) {
  const data = await ajaxRequest(
    "/course/active/selectActiveOperList.do",
    new CourseRequest(count)
  );

  return data.list.map(course => new Course(
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
    null, // csCmplTime will be filled later
    course.csTitlePath,
    []    // csCmplList will be filled later
  ));
}

/* ------------------------------------------------------------------ */
/* Optimized fetch orchestrator + public API                           */
/* ------------------------------------------------------------------ */

export async function fetchCoursesOptimized(action, options = {}) {
  console.log('=== Starting Optimized Course Fetch ===');

  const config = {
    maxConcurrent: 15,
    batchSize: 100,
    delayBetweenBatches: 3000,
    enableCache: true,
    ...options
  };

  const fetcher = new CourseDataFetcher(config);

  try {
    console.log('Fetching total course count...');
    const totalCourseCount = await getTotalCourseCount();
    console.log(`Found ${totalCourseCount} courses`);

    console.log('Fetching course list...');
    const courses = await getCourses(totalCourseCount);
    console.log(`Retrieved ${courses.length} courses`);

    console.log('Processing course details with parallel fetching...');
    console.log(`Configuration: ${JSON.stringify(config)}`);

    const startTime = Date.now();
    let lastProgressUpdate = 0;

    const result = await fetcher.processAllCourses(courses, (progress) => {
      const now = Date.now();
      if (now - lastProgressUpdate > 5000) {
        lastProgressUpdate = now;

        const etaMinutes = Math.floor(progress.estimatedRemaining / 60000);
        const etaSeconds = Math.floor((progress.estimatedRemaining % 60000) / 1000);

        console.log(`Progress: ${progress.itemsProcessed}/${progress.totalItems} courses`);
        console.log(`Batch: ${progress.currentBatch}/${progress.totalBatches}`);
        console.log(`ETA: ${etaMinutes}m ${etaSeconds}s`);
        console.log(`Cache hits: ${progress.stats.cachedResponses}`);
        console.log(`Failed requests: ${progress.stats.failedRequests}`);

        if (typeof estimatedProgressTime === 'function') {
          estimatedProgressTime(
            progress.itemsProcessed,
            progress.totalItems,
            startTime,
            'Processing Courses'
          );
        }
      }
    });

    const duration = Date.now() - startTime;
    console.log('=== Processing Complete ===');
    console.log(`Total time: ${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`);
    console.log(`Successful courses: ${result.courses.length}`);
    console.log(`Failed courses: ${result.errors.length}`);
    console.log(`Total API requests: ${result.stats.totalRequests}`);
    console.log(`Cached responses: ${result.stats.cachedResponses}`);
    console.log(`Success rate: ${result.stats.successRate}%`);

    if (result.errors.length > 0) {
      console.warn('Failed courses:', result.errors);
    }

    if (action === 'add') {
      console.log('Adding courses to database...');
      await addData('courses', result.courses);
      console.log(`Successfully added ${result.courses.length} courses to database`);
    } else if (action === 'update') {
      console.log('Updating courses in database...');
      await updateData('courses', result.courses);
      console.log(`Successfully updated ${result.courses.length} courses in database`);
    } else if (action) {
      throw new Error(`Unknown action: ${action}`);
    }

    if (result.errors.length > 0) {
      const errorReport = {
        timestamp: new Date().toISOString(),
        errors: result.errors,
        stats: result.stats
      };
      await addData(`course_errors_${Date.now()}`, errorReport);
      console.log('Error report saved for retry');
    }

    return result.courses;

  } catch (error) {
    console.error('Fatal error during course fetching:', error);
    throw error;
  }
}

export async function updateCourses(options = {}) {
  return await fetchCoursesOptimized('update', options);
}

export async function addCourses(options = {}) {
  return await fetchCoursesOptimized('add', options);
}

/* ------------------------------------------------------------------ */
/* Search helpers (restored for compatibility with existing callers)   */
/* ------------------------------------------------------------------ */

function isCustomCourse(course, keyword) {
  return course.csTitle.includes(keyword) && course.csTitlePath === '맞춤형';
}

export async function searchCourses(input = '', year = new Date().getFullYear()) {
  const exist = await getData('courses');
  if (!exist) {
    await addCourses();
  }
  const courses = await getData('courses');

  const keywords = input.trim() ? input.split(' ') : [];
  if (keywords.length === 0) {
    return courses.filter(c => c.csYear >= year);
  }

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

export async function searchCustomCourses(input = '', year = new Date().getFullYear()) {
  const exist = await getData('courses');
  if (!exist) {
    await addCourses();
  }
  const courses = await getData('courses');
  customTable(courses);

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
  return results;
}
