import * as jQuery from 'jquery';
import { customTable, getCSRFToken, createLogger } from './shared.js';
import { addData, getData, updateData } from "./storage";
import { estimatedProgressTime } from "./solution";

// Create logger for course component
const logger = createLogger('COURSE');

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
      logger.debug('Completion date is null, returning null');
      return null;
    }

    logger.debug(`Formatting completion date: ${cxCompletionDate}`);

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
    const formattedDate = new Date(
      Date.UTC(year, month - 1, day, hour, minute, second) + timezoneOffset);

    logger.debug(`Formatted completion date result: ${formattedDate}`);
    return formattedDate;
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

/**
 * Fetches the total number of completion records for a course.
 * @function getCompletionCount
 * @param {string} csCourseActiveSeq - The course active sequence.
 * @returns {Promise<number>} - The total number of completion records.
 * @throws {Error} - The error that occurred while fetching the completion records.
 */
function getCompletionCount(csCourseActiveSeq) {
  logger.debug(`Fetching completion count for course: ${csCourseActiveSeq}`);

  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true // Include cookies in the request
      },
      url: "/course/cmpl/selectCmplList.do",
      type: "post",
      data: new CompletionRequest(csCourseActiveSeq),
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        logger.debug(`Completion count for course ${csCourseActiveSeq}: ${data.cnt}`);
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}) for completion count: ${error}`);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          logger.debug(`Retrying completion count request for course: ${csCourseActiveSeq}`);
          jQuery.ajax(this);
        } else {
          logger.error(`Failed to fetch completion count for course ${csCourseActiveSeq} after all attempts`, {
            xhr: xhr,
            status: status,
            error: error
          });
          reject(new Error(`Failed to fetch completion count: ${error}`));
        }
      }
    });
  });
}

/**
 * Fetches the completion records for a course.
 * @function getCourseCompletion
 * @param {string} csCourseActiveSeq - The course active sequence.
 * @param {string} csCourseMasterSeq - The course master sequence.
 * @param {number} count - The number of completion records to return.
 * @returns {Promise<Completion[]>} - The completion records.
 * @throws {Error} - The error that occurred while fetching the completion records.
 */
function getCourseCompletion(csCourseActiveSeq, csCourseMasterSeq, count) {
  logger.debug(`Fetching course completion for course: ${csCourseActiveSeq}, master: ${csCourseMasterSeq}, count: ${count}`);

  // Function to fetch the completion list
  function fetchCompletionList() {
    return new Promise((resolve, reject) => {
      jQuery.ajax({
        headers: {
          'X-CSRF-TOKEN': getCSRFToken()
        },
        xhrFields: {
          withCredentials: true // Include cookies in the request
        },
        url: "/course/cmpl/selectCmplList.do",
        type: "post",
        data: new CompletionRequest(Number(csCourseActiveSeq), count),
        dataType: "json",
        tryCount: 0,
        retryLimit: 3,
        success: function (data) {
          logger.debug(`Fetched ${data.list.length} completion records`);
          resolve(data.list.map(completion => ({
            csMemberSeq: completion.csMemberSeq,
            csMemberId: completion.csMemberId,
            csMemberName: completion.csMemberName,
            cxMemberEmail: completion.cxMemberEmail,
            csApplyStatusCd: completion.csApplyStatusCd,
            csStudyStartDate: '', // Initially empty
            csCompletionYn: completion.csCompletionYn,
            cxCompletionDate: completion.cxCompletionDate
          })));
        },
        error: function (xhr, status, error) {
          logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}) for completion list: ${error}`);
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
            logger.debug('Retrying completion list request');
            jQuery.ajax(this);
          } else {
            logger.error('Failed to fetch course completion from server after all attempts', {
              xhr: xhr,
              status: status,
              error: error
            });
            reject(new Error(`Failed to fetch course completion: ${error}`));
          }
        }
      });
    });
  }

  // Function to fetch the study start dates
  function fetchStudyStartDates() {
    return new Promise((resolve, reject) => {
      jQuery.ajax({
        headers: {
          'X-CSRF-TOKEN': getCSRFToken()
        },
        xhrFields: {
          withCredentials: true // Include cookies in the request
        },
        url: "/course/apply/selectApplyList.do",
        type: "post",
        data: new ApplicationRequest(Number(csCourseActiveSeq),
          Number(csCourseMasterSeq), count),
        dataType: "json",
        tryCount: 0,
        retryLimit: 3,
        success: function (data) {
          logger.debug(`Fetched ${data.list.length} application records for study start dates`);
          const startDateMap = new Map();
          data.list.forEach(apply => {
            startDateMap.set(apply.csMemberSeq, apply.csStudyStartDate);
          });
          resolve(startDateMap);
        },
        error: function (xhr, status, error) {
          logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}) for study start dates: ${error}`);
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
            logger.debug('Retrying study start dates request');
            jQuery.ajax(this);
          } else {
            logger.error('Failed to fetch study start dates from server after all attempts', {
              xhr: xhr,
              status: status,
              error: error
            });
            reject(new Error(`Failed to fetch study start dates: ${error}`));
          }
        }
      });
    });
  }

  // Combine the results of both AJAX calls
  return Promise.all([fetchCompletionList(), fetchStudyStartDates()])
    .then(([completionList, startDateMap]) => {
      logger.debug('Combining completion list with study start dates');
      // Fill in the missing csStudyStartDate
      return completionList.map(completion => {
        return new Completion(
          completion.csMemberSeq,
          completion.csMemberId,
          completion.csMemberName,
          completion.cxMemberEmail,
          completion.csApplyStatusCd,
          startDateMap.get(completion.csMemberSeq) || '', // Use the study start date from the map or default to ''
          completion.csCompletionYn,
          completion.cxCompletionDate);
      });
    })
    .catch(error => {
      logger.error('Error fetching course completion', error);
      throw error; // Re-throw the error to ensure the promise is rejected
    });
}

/**
 * Fetches the total number of course classes for a course.
 * @function getCourseClassCount
 * @param {string} csCourseActiveSeq - The course active sequence.
 * @returns {Promise<number>} - The total number of course classes.
 * @throws {Error} - The error that occurred while fetching the course classes.
 */
function getCourseClassCount(csCourseActiveSeq) {
  logger.debug(`Fetching class count for course: ${csCourseActiveSeq}`);

  const request = {
    csCourseActiveSeq: csCourseActiveSeq,
    csReferenceTypeCd: 'organization',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  }
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true // Include cookies in the request
      },
      url: "/course/active/selectAtiveElementList.do",
      type: "post",
      data: request,
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        logger.debug(`Class count for course ${csCourseActiveSeq}: ${data.list.length}`);
        resolve(data.list.length);
      },
      error: function (xhr, status, error) {
        logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}) for class count: ${error}`);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          logger.debug(`Retrying class count request for course: ${csCourseActiveSeq}`);
          jQuery.ajax(this);
        } else {
          logger.error(`Failed to fetch class count for course ${csCourseActiveSeq} after all attempts`, {
            xhr: xhr,
            status: status,
            error: error
          });
          reject(new Error(`Failed to fetch class count: ${error}`));
        }
      }
    });
  });
}

/**
 * Fetches exam information for a course.
 * @function getCourseExamCount
 * @param {Course} course - The course.
 * @returns {Promise<number>} - The total number of exams.
 * @throws {Error} - The error that occurred while fetching the exams.
 */
function getCourseExamCount(course) {
  logger.debug(`Fetching exam count for course: ${course.csCourseActiveSeq}`);

  const request = {
    csCourseActiveSeq: course.csCourseActiveSeq,
    csReferenceTypeCd: 'exam',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  }
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true // Include cookies in the request
      },
      url: "/course/active/selectAtiveElementList.do",
      type: "post",
      data: request,
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        logger.debug(`Exam count for course ${course.csCourseActiveSeq}: ${data.list.length}`);
        resolve(data.list.length);
      },
      error: function (xhr, status, error) {
        logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}) for exam count: ${error}`);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          logger.debug(`Retrying exam count request for course: ${course.csCourseActiveSeq}`);
          jQuery.ajax(this);
        } else {
          logger.error(`Failed to fetch exam count for course ${course.csCourseActiveSeq} after all attempts`, {
            xhr: xhr,
            status: status,
            error: error
          });
          reject(new Error(`Failed to fetch exam count: ${error}`));
        }
      }
    });
  });
}

/**
 * Fetches the total number of courses from the server.
 * @function getTotalCourseCount
 * @returns {Promise<number>} - The total number of courses.
 * @throws {Error} - Failed to fetch course count from server.
 */
function getTotalCourseCount() {
  logger.debug('Fetching total course count from server');

  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true // Include cookies in the request
      },
      url: "/course/active/selectActiveOperList.do",
      type: "post",
      data: new CourseRequest(),
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        logger.info(`Total course count: ${data.cnt}`);
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}) for course count: ${error}`);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          logger.debug('Retrying total course count request');
          jQuery.ajax(this);
        } else {
          logger.error('Failed to fetch course count from server after all attempts', {
            xhr: xhr,
            status: status,
            error: error
          });
          reject(new Error(`Failed to fetch course count: ${error}`));
        }
      }
    });
  })
}

/**
 * Fetches the courses from the server.
 * @function getCourses
 * @param {number} count - The number of courses to return.
 * @returns {Promise<Course[]>} - The courses.
 * @throws {Error} - Failed to fetch courses from server.
 */
function getCourses(count = 10) {
  logger.debug(`Fetching ${count} courses from server`);

  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true // Include cookies in the request
      },
      url: "/course/active/selectActiveOperList.do",
      type: "post",
      data: new CourseRequest(count),
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        logger.debug(`Processing ${data.list.length} course records`);
        const courses = data.list.map(course => new Course(course.csCourseActiveSeq,
          course.csCourseMasterSeq, course.csTitle, course.csStatusCd,
          course.csCourseTypeCd, course.csYear, course.csApplyStartDate,
          course.csApplyEndDate, course.csStudyStartDate,
          course.csStudyEndDate, course.csOpenStartDate, course.csOpenEndDate,
          null, course.csTitlePath, null));
        logger.info(`Successfully fetched ${courses.length} courses`);
        resolve(courses);
      },
      error: function (xhr, status, error) {
        logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}) for courses: ${error}`);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          logger.debug('Retrying courses request');
          jQuery.ajax(this);
        } else {
          logger.error('Failed to fetch courses from server after all attempts', {
            xhr: xhr,
            status: status,
            error: error
          });
          reject(new Error(`Failed to fetch courses: ${error}`));
        }
      }
    });
  });
}

/**
 * Fetch the courses from the server and add them to the database.
 * @function fetchCourses
 * @param {string} action - The action to perform on the courses.
 * @returns {Promise<Course[]>} - The courses.
 * @throws {Error} - Unknown action.
 */
async function fetchCourses(action) {
  logger.info(`Starting fetch courses operation: ${action}`);

  try {
    logger.info('Fetching count of courses...')
    const totalCourseCount = await getTotalCourseCount();
    logger.info(`Found ${totalCourseCount} courses`)

    logger.info('Fetching courses...')
    const courses = await getCourses(totalCourseCount);
    logger.info(`Fetched ${courses.length} courses`)

    var started = Date.now();
    for (let i = 0; i < courses.length; i++) {
      estimatedProgressTime(i, courses.length, started, '과정');
      const course = courses[i];
      logger.debug(`Processing course [${i + 1} / ${courses.length}] ${course.csYear} ${course.csTitle}...`);

      logger.debug(`Fetching class count for course ${course.csCourseActiveSeq}...`)
      const classCount = await getCourseClassCount(course.csCourseActiveSeq);
      const examCount = await getCourseExamCount(course);
      logger.debug(`Found ${classCount} classes and ${examCount} exams for course ${course.csCourseActiveSeq}`)
      course.csCmplTime = classCount + examCount;

      logger.debug(`Fetching completion count for course ${course.csCourseActiveSeq}...`)
      const completionCount = await getCompletionCount(course.csCourseActiveSeq);
      logger.debug(`Found ${completionCount} completion records for course ${course.csCourseActiveSeq}`)

      logger.debug(`Fetching completions for course ${course.csCourseActiveSeq}...`)
      const completions = await getCourseCompletion(course.csCourseActiveSeq,
        course.csCourseMasterSeq,
        completionCount);
      logger.debug(`Fetched ${completions.length} completions for course ${course.csCourseActiveSeq}`)
      course.csCmplList = completions;
    }
    logger.info(`Processed ${courses.length} courses`)

    if (action === 'add') {
      logger.info('Adding courses to database...')
      await addData('courses', courses);
      logger.info(`Successfully added ${courses.length} courses to database`)
    } else if (action === 'update') {
      logger.info('Updating courses in database...')
      await updateData('courses', courses);
      logger.info(`Successfully updated ${courses.length} courses in database`)
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return courses;
  } catch (error) {
    logger.error(`Failed to fetch courses with action: ${action}`, error);
    throw error;
  }
}

/**
 * Fetches the courses from the server and adds them to the database.
 * @function addCourses
 * @returns {Promise<Course[]>} - The courses.
 * @throws {Error} - Failed to add courses to database.
 */
async function addCourses() {
  logger.info('Initiating add courses operation');
  return await fetchCourses('add');
}

/**
 * Fetches the courses from the server and updates them in the database.
 * @function updateCourses
 * @returns {Promise<Course[]>} - The courses.
 * @throws {Error} - Failed to update courses in database.
 */
async function updateCourses() {
  logger.info('Initiating update courses operation');
  return await fetchCourses('update');
}

/**
 * Checks if a course is a custom course with a specific keyword.
 * @param {Course} course
 * @param {string} keyword
 * @returns {boolean}
 */
function isCustomCourse(course, keyword) {
  const result = course.csTitle.includes(keyword) && course.csTitlePath === '맞춤형';
  logger.debug(`Course ${course.csCourseActiveSeq} custom course match for "${keyword}": ${result}`);
  return result;
}

async function searchCustomCourses(input = '',
  year = new Date().getFullYear()) {
  logger.info(`Searching custom courses with input: "${input}", year: ${year}`);

  try {
    // Get all courses from the database
    const exist = await getData('courses');
    if (!exist) {
      logger.info('Courses not found in database, fetching from server');
      await addCourses();
    }
    const courses = await getData('courses');
    customTable(courses);
    logger.info(`Found ${courses.length} courses in the database`);

    // Split the search keywords
    const keywords = input.split(' ');
    logger.debug(`Search keywords: ${keywords.join(', ')}`);

    // Search for courses that match the search criteria
    const results = [];
    for (const course of courses) {
      for (const keyword of keywords) {
        // Search for course's attributes that match the keyword
        if (isCustomCourse(course, keyword) && course.csYear === year) {
          results.push(course);
          break;
        }
      }
    }

    // Table the search results
    customTable(results);
    logger.info(`Found ${results.length} courses that match the search criteria`);

    // Return the search results
    return results;
  } catch (error) {
    logger.error('Failed to search custom courses', error);
    throw error;
  }
}

export async function searchCourses(input = '',
  year = new Date().getFullYear()) {
  logger.info(`Searching courses with input: "${input}", year: ${year}`);

  try {
    // Get all courses from the database
    const exist = await getData('courses');
    if (!exist) {
      logger.info('Courses not found in database, fetching from server');
      await addCourses();
    }
    const courses = await getData('courses');
    logger.debug(`Retrieved ${courses.length} courses from database`);

    // Split the search keywords
    const keywords = input.split(' ');
    logger.debug(`Search keywords: ${keywords.join(', ')}`);

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

    logger.info(`Search completed, found ${results.length} matching courses`);
    return results;
  } catch (error) {
    logger.error('Failed to search courses', error);
    throw error;
  }
}

export { updateCourses };