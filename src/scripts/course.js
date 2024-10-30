import * as jQuery from 'jquery';

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
 * @param {string} csCompletionYn - The completion status.
 * @param {string} cxCompletionDate - The completion date.
 * @returns {Completion} - The completion object.
 */
class Completion {
  constructor(csMemberSeq, csMemberId, csMemberName, cxMemberEmail,
      csApplyStatusCd, csCompletionYn, cxCompletionDate) {
    this.csMemberSeq = csMemberSeq;
    this.csMemberId = csMemberId;
    this.csMemberName = csMemberName;
    this.cxMemberEmail = cxMemberEmail;
    this.csApplyStatusCd = csApplyStatusCd;
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
    ACTIVE: 'active',
    INACTIVE: 'inactive'
  }
  static Type = {
    ALWAYS: 'always',
    PERIOD: 'period'
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
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': csrfToken
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
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        console.log(xhr);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          jQuery.ajax(this);
        } else {
          reject(error);
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
  // Function to fetch the completion list
  function fetchCompletionList() {
    return new Promise((resolve, reject) => {
      jQuery.ajax({
        headers: {
          'X-CSRF-TOKEN': csrfToken
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
          console.log(xhr);
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
            jQuery.ajax(this);
          } else {
            console.error("Failed to fetch course completion from server!");
            reject(xhr, status, error);
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
          'X-CSRF-TOKEN': csrfToken
        },
        xhrFields: {
          withCredentials: true // Include cookies in the request
        },
        url: "/course/apply/selectApplyList.do",
        type: "post",
        data: new ApplicationRequest(Number(csCourseActiveSeq),
            Number(csCourseMasterSeq),
            count),
        dataType: "json",
        tryCount: 0,
        retryLimit: 3,
        success: function (data) {
          const startDateMap = new Map();
          data.list.forEach(apply => {
            startDateMap.set(apply.csMemberSeq, apply.csStudyStartDate);
          });
          resolve(startDateMap);
        },
        error: function (xhr, status, error) {
          console.log(xhr);
          this.tryCount++;
          if (this.tryCount <= this.retryLimit) {
            jQuery.ajax(this);
          } else {
            console.error("Failed to fetch study start dates from server!");
            reject(xhr, status, error);
          }
        }
      });
    });
  }

  // Combine the results of both AJAX calls
  return Promise.all([fetchCompletionList(), fetchStudyStartDates()])
  .then(([completionList, startDateMap]) => {
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
          completion.cxCompletionDate
      );
    });
  })
  .catch(error => {
    console.error('Error fetching course completion:', error);
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
  const request = {
    csCourseActiveSeq: csCourseActiveSeq,
    csReferenceTypeCd: 'organization',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  }
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': csrfToken
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
        resolve(data.list.length);
      },
      error: function (xhr, status, error) {
        console.log(xhr);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          jQuery.ajax(this);
        } else {
          console.error("failed to fetch class count from server!");
          reject(xhr, status, error);
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
  const request = {
    csCourseActiveSeq: course.csCourseActiveSeq,
    csReferenceTypeCd: 'exam',
    dspMenuId: 'MG0005',
    dspLinkMenuId: 'MG0005'
  }
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': csrfToken
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
        resolve(data.list.length);
      },
      error: function (xhr, status, error) {
        console.log(xhr);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          jQuery.ajax(this);
        } else {
          console.error("failed to fetch class count from server!");
          reject(xhr, status, error);
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
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': csrfToken
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
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        console.log(xhr);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          jQuery.ajax(this);
        } else {
          console.error("failed to fetch course count from server!");
          reject(xhr, status, error);
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
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': csrfToken
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
        console.log(xhr);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          jQuery.ajax(this);
        } else {
          console.error("failed to fetch courses from server!");
          reject(xhr, status, error);
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
  console.log('Fetching count of courses...')
  const totalCourseCount = await getTotalCourseCount();
  console.log(`Found ${totalCourseCount} courses.`)

  console.log('Fetching courses...')
  const courses = await getCourses(totalCourseCount);
  console.log(`Fetched ${courses.length} courses.`)

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    console.log(`Processing course [${i
    + 1} / ${courses.length}] ${course.csYear} ${course.csTitle}...`);

    console.debug(
        `Fetching class count for course ${course.csCourseActiveSeq}...`)
    const classCount = await getCourseClassCount(course.csCourseActiveSeq);
    const examCount = await getCourseExamCount(course);
    console.debug(
        `Found ${classCount} classes for course ${course.csCourseActiveSeq}.`)
    console.debug(
        `Found ${examCount} exams for course ${course.csCourseActiveSeq}.`)
    course.csCmplTime = classCount + examCount;

    console.debug(
        `Fetching completion count for course ${course.csCourseActiveSeq}...`)
    const completionCount = await getCompletionCount(course.csCourseActiveSeq);
    console.debug(
        `Found ${completionCount} completion records for course ${course.csCourseActiveSeq}.`)

    console.debug(
        `Fetching completions for course ${course.csCourseActiveSeq}...`)
    const completions = await getCourseCompletion(course.csCourseActiveSeq,
        completionCount);
    console.debug(
        `Fetched ${completions.length} completions for course ${course.csCourseActiveSeq}.`)
    course.csCmplList = completions;
  }
  console.log(`Processed ${courses.length} courses.`)

  if (action === 'add') {
    console.log('Adding courses to database...')
    await addData('courses', courses);
    console.log(`Successfully added ${courses.length} courses to database.`)
  } else if (action === 'update') {
    console.log('Updating courses in database...')
    await updateData('courses', courses);
    console.log(`Successfully updated ${courses.length} courses in database.`)
  } else {
    throw new Error(`Unknown action: ${action}`);
  }

  return courses;
}

/**
 * Fetches the courses from the server and adds them to the database.
 * @function addCourses
 * @returns {Promise<Course[]>} - The courses.
 * @throws {Error} - Failed to add courses to database.
 */
async function addCourses() {
  return await fetchCourses('add');
}

/**
 * Fetches the courses from the server and updates them in the database.
 * @function updateCourses
 * @returns {Promise<Course[]>} - The courses.
 * @throws {Error} - Failed to update courses in database.
 */
async function updateCourses() {
  return await fetchCourses('update');
}

/**
 * Checks if a course is a custom course with a specific keyword.
 * @param {Course} course
 * @param {string} keyword
 * @returns {boolean}
 */
function isCustomCourse(course, keyword) {
  return course.csTitle.includes(keyword) && course.csTitlePath === '맞춤형';
}

async function searchCustomCourses(input = '',
    year = new Date().getFullYear()) {
  // Get all courses from the database
  const exist = await getData('courses');
  if (!exist) {
    await addCourses();
  }
  const courses = await getData('courses');
  customTable(courses);
  console.log(`Found ${courses.length} courses in the database.`);

  // Split the search keywords
  const keywords = input.split(' ');

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
  console.log(
      `Found ${results.length} courses that match the search criteria.`);

  // Return the search results
  return results;
}

export async function searchCourses(input = '',
    year = new Date().getFullYear()) {
  // Get all courses from the database
  const exist = await getData('courses');
  if (!exist) {
    await addCourses();
  }
  const courses = await getData('courses');
  // customTable(courses);
  // console.log(`Found ${courses.length} courses in the database.`);

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

  // Table the search results
  // customTable(results);
  // console.log(`Found ${results.length} courses that match the search criteria.`);

  // Return the search results
  return results;
}

export {updateCourses};