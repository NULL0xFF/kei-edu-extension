import * as jQuery from 'jquery';
import Logger from './logger.js';
import {getData} from "./storage";
import {ajaxJSON, getCSRFToken} from "./utility";

const logger = new Logger('course');

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

    if (cxCompletionDate instanceof Date) {
      return cxCompletionDate;
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

    cxCompletionDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second) + timezoneOffset);

    return cxCompletionDate;
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

async function getTotalCourseCount({signal}) {
  const csrf = getCSRFToken();
  const payload = new CourseRequest();

  const response = await ajaxJSON({
    url: '/course/active/selectActiveOperList.do',
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': csrf
    },
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    data: jQuery.param(payload, true)
  }, {signal, timeout: 500, retries: 6});

  const count = Number(response?.cnt);

  if (!Number.isFinite(count)) {
    logger.error(`Invalid response: expected numeric "cnt", got ${JSON.stringify(response)}`, 'getTotalCourseCount');
    throw new Error('Invalid response');
  }

  return count;
}

/**
 * Fetches all courses based on the provided count.
 *
 * @param signal
 * @param count - The number of courses to fetch.
 * @returns {Promise<Course[]>} - A promise that resolves to an array of Course objects.
 */
async function getAllCourses({signal}, count) {
  const csrf = getCSRFToken();
  const payload = new CourseRequest(count);

  const response = await ajaxJSON({
    url: '/course/active/selectActiveOperList.do',
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': csrf
    },
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    data: jQuery.param(payload, true)
  }, {signal, timeout: 20000, retries: 3});

  const courses = response?.list.map(course => new Course(course.csCourseActiveSeq,
    course.csCourseMasterSeq, course.csTitle, course.csStatusCd,
    course.csCourseTypeCd, course.csYear, course.csApplyStartDate,
    course.csApplyEndDate, course.csStudyStartDate,
    course.csStudyEndDate, course.csOpenStartDate, course.csOpenEndDate,
    null, course.csTitlePath, null));

  return courses;
}

async function getCourseChapterCount({signal}, csCourseActiveSeq) {
  const csrf = getCSRFToken();
  const payload = {
    csCourseActiveSeq: csCourseActiveSeq,
    csReferenceTypeCd: 'organization',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  }

  const response = await ajaxJSON({
    url: '/course/active/selectAtiveElementList.do',
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': csrf
    },
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    data: jQuery.param(payload, true)
  }, {
    signal,
    timeout: 500,
    retries: 6,
    retryInitialDelayMs: 1000,
    retryFactor: 2,
    retryCapMs: 16000,
    totalBudgetMs: 60000
  });

  const count = Number(response?.list?.length);

  if (!Number.isFinite(count)) {
    logger.error(`Invalid response: expected numeric "list.length", got ${JSON.stringify(response)}`, 'getCourseChapterCount');
    throw new Error('Invalid response');
  }

  return count;
}

async function getCourseExamCount({signal}, csCourseActiveSeq) {
  const csrf = getCSRFToken();
  const payload = {
    csCourseActiveSeq: csCourseActiveSeq,
    csReferenceTypeCd: 'exam',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  }

  const response = await ajaxJSON({
    url: '/course/active/selectAtiveElementList.do',
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': csrf
    },
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    data: jQuery.param(payload, true)
  }, {
    signal,
    timeout: 500,
    retries: 6,
    retryInitialDelayMs: 1000,
    retryFactor: 2,
    retryCapMs: 16000,
    totalBudgetMs: 60000
  });

  const count = Number(response?.list?.length);

  if (!Number.isFinite(count)) {
    logger.error(`Invalid response: expected numeric "list.length", got ${JSON.stringify(response)}`, 'getCourseChapterCount');
    throw new Error('Invalid response');
  }

  return count;
}

async function getCompletionCount({signal}, csCourseActiveSeq) {
  const csrf = getCSRFToken();
  const payload = new CompletionRequest(csCourseActiveSeq);

  const response = await ajaxJSON({
    url: '/course/cmpl/selectCmplList.do',
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': csrf
    },
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    data: jQuery.param(payload, true)
  }, {
    signal,
    timeout: 500,
    retries: 6,
    retryInitialDelayMs: 1000,
    retryFactor: 2,
    retryCapMs: 16000,
    totalBudgetMs: 60000
  });

  const count = Number(response?.cnt);

  if (!Number.isFinite(count)) {
    logger.error(`Invalid response: expected numeric "cnt", got ${JSON.stringify(response)}`, 'getCompletionCount');
    throw new Error('Invalid response');
  }

  return count;
}

async function getAllCompletions({signal}, csCourseActiveSeq, csCourseMasterSeq, count) {
  const csrf = getCSRFToken();

  const listPayload = new CompletionRequest(csCourseActiveSeq, count);
  const listResponse = await ajaxJSON({
    url: '/course/cmpl/selectCmplList.do',
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': csrf
    },
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    data: jQuery.param(listPayload, true)
  }, {
    signal,
    timeout: 500,
    retries: 6,
    retryInitialDelayMs: 1000,
    retryFactor: 2,
    retryCapMs: 16000,
    totalBudgetMs: 60000
  });

  const completions = listResponse?.list.map(completion => new Completion(
    completion.csMemberSeq,
    completion.csMemberId,
    completion.csMemberName,
    completion.cxMemberEmail,
    completion.csApplyStatusCd,
    '', // Initially empty
    completion.csCompletionYn,
    completion.cxCompletionDate
  ));

  const appPayload = new ApplicationRequest(csCourseActiveSeq, csCourseMasterSeq, count);
  const appResponse = await ajaxJSON({
    url: '/course/apply/selectApplyList.do',
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': csrf
    },
    contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
    data: jQuery.param(appPayload, true)
  }, {
    signal,
    timeout: 500,
    retries: 6,
    retryInitialDelayMs: 1000,
    retryFactor: 2,
    retryCapMs: 16000,
    totalBudgetMs: 60000
  });

  const startDateMap = new Map();
  appResponse.list.forEach(apply => {
    startDateMap.set(apply.csMemberSeq, apply.csStudyStartDate);
  });
  completions.forEach(completion => {
      completion.csStudyStartDate = startDateMap.get(completion.csMemberSeq) || null;
    }
  );

  return completions;
}

async function loadCourses(input = '', year = new Date().getFullYear()) {
  // Get all courses from the database
  const exist = await getData('courses');
  if (!exist) {
    logger.error('No course data found in the database. Please fetch and store course data first.', 'loadCourses');
    throw new Error('No course data found in the database.');
  }
  const courses = await getData('courses');

  // Split the search keywords
  const keywords = input.split(' ');

  // Search for courses that match the search criteria
  const results = [];
  for (const course of courses) {
    for (const keyword of keywords) {
      // Search for course's attributes that match the keyword
      if (course.csTitle.includes(keyword) && course.csYear >= year) {
        results.push(course);
        break;
      }
    }
  }

  // Return the search results
  return results;
}

export {
  Course,
  CourseRequest,
  Completion,
  CompletionRequest,
  ApplicationRequest,
  getTotalCourseCount,
  getAllCourses,
  getCourseChapterCount,
  getCourseExamCount,
  getCompletionCount,
  getAllCompletions,
  loadCourses
}