// src/scripts/course.js
import $ from 'jquery';
import {addData, updateData} from './storage';

// Class definitions
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

  formatCompletionDate(cxCompletionDate) {
    // Original Date is in format: yyyyMMddHHmmss
    if (cxCompletionDate === null) {
      return null;
    }
    const timezoneOffset = new Date().getTimezoneOffset() * 60000;
    const year = cxCompletionDate.substring(0, 4);
    const month = cxCompletionDate.substring(4, 6);
    const day = cxCompletionDate.substring(6, 8);
    const hour = cxCompletionDate.substring(8, 10);
    const minute = cxCompletionDate.substring(10, 12);
    const second = cxCompletionDate.substring(12, 14);
    const formattedDate = new Date(
        Date.UTC(year, month - 1, day, hour, minute, second) + timezoneOffset);
    return formattedDate;
  }
}

class CompletionRequest {
  static MENU_ID = 'MG0036';
  static Order = {
    MEMBER_ASC: 1,
    MEMBER_DESC: -1,
    END_DATE_ASC: 4,
    END_DATE_DESC: -4,
  };

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

class Course {
  static Status = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  };
  static Type = {
    ALWAYS: 'always',
    PERIOD: 'period',
  };
  static Category = {
    INTRO: '입문',
    ADVANCED: '심화',
    GENERAL: '일반',
    CUSTOMIZED: '맞춤형',
    FOREIGN: '외국어',
  };

  constructor(
      csCourseActiveSeq,
      csCourseMasterSeq,
      csTitle,
      csStatusCd,
      csCourseTypeCd,
      csYear,
      csApplyStartDate,
      csApplyEndDate,
      csStudyStartDate,
      csStudyEndDate,
      csOpenStartDate,
      csOpenEndDate,
      csCmplTime,
      csTitlePath,
      csCmplList = []
  ) {
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
    DATE_DESC: -4,
  };
  static Category = {
    ALL: '',
    INTRO: '1',
    ADVANCED: '2',
    GENERAL: '3',
    CUSTOMIZED: '14',
    FOREIGN: '16',
  };
  static Type = {
    ALL: '',
    ALWAYS: 'always',
    PERIOD: 'period',
  };
  static Status = {
    ALL: '',
    ACTIVE: 'active',
    INACTIVE: 'inactive',
  };

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

// AJAX functions
export function getCompletionCount(csCourseActiveSeq) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/course/cmpl/selectCmplList.do',
      type: 'post',
      data: new CompletionRequest(csCourseActiveSeq),
      dataType: 'json',
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          $.ajax(this);
          return;
        } else {
          reject(error);
        }
      },
    });
  });
}

export function getCourseCompletion(csCourseActiveSeq, count) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/course/cmpl/selectCmplList.do',
      type: 'post',
      data: new CompletionRequest(csCourseActiveSeq, count),
      dataType: 'json',
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        resolve(
            data.list.map(
                (completion) =>
                    new Completion(
                        completion.csMemberSeq,
                        completion.csMemberId,
                        completion.csMemberName,
                        completion.cxMemberEmail,
                        completion.csApplyStatusCd,
                        completion.csCompletionYn,
                        completion.cxCompletionDate
                    )
            )
        );
      },
      error: function (xhr, status, error) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          $.ajax(this);
          return;
        } else {
          reject(error);
        }
      },
    });
  });
}

export function getTotalCourseCount() {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/course/active/selectActiveOperList.do',
      type: 'post',
      data: new CourseRequest(),
      dataType: 'json',
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          $.ajax(this);
          return;
        } else {
          reject(error);
        }
      },
    });
  });
}

export function getCourses(count = 10) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/course/active/selectActiveOperList.do',
      type: 'post',
      data: new CourseRequest(count),
      dataType: 'json',
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        resolve(
            data.list.map(
                (course) =>
                    new Course(
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
                    )
            )
        );
      },
      error: function (xhr, status, error) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          $.ajax(this);
          return;
        } else {
          reject(error);
        }
      },
    });
  });
}

// Function to fetch courses and add/update them in the database
async function fetchCourses(action) {
  console.log('Fetching count of courses...');
  const totalCourseCount = await getTotalCourseCount();
  console.log(`Found ${totalCourseCount} courses.`);

  console.log('Fetching courses...');
  const courses = await getCourses(totalCourseCount);
  console.log(`Fetched ${courses.length} courses.`);

  for (let i = 0; i < courses.length; i++) {
    const course = courses[i];
    console.log(`Processing course [${i
    + 1} / ${courses.length}] ${course.csYear} ${course.csTitle}...`);

    // Fetch class count
    // You need to implement getCourseClassCount function or import it if it's defined elsewhere
    // const classCount = await getCourseClassCount(course.csCourseActiveSeq);

    // Fetch exam count
    // You need to implement getCourseExamCount function or import it if it's defined elsewhere
    // const examCount = await getCourseExamCount(course);

    // For demonstration, let's assume classCount and examCount are 0
    const classCount = 0;
    const examCount = 0;

    course.csCmplTime = classCount + examCount;

    // Fetch completion count
    const completionCount = await getCompletionCount(course.csCourseActiveSeq);

    // Fetch completions
    const completions = await getCourseCompletion(course.csCourseActiveSeq,
        completionCount);
    course.csCmplList = completions;
  }
  console.log(`Processed ${courses.length} courses.`);

  if (action === 'add') {
    console.log('Adding courses to database...');
    await addData('courses', courses);
    console.log(`Successfully added ${courses.length} courses to database.`);
  } else if (action === 'update') {
    console.log('Updating courses in database...');
    await updateData('courses', courses);
    console.log(`Successfully updated ${courses.length} courses in database.`);
  } else {
    throw new Error(`Unknown action: ${action}`);
  }

  return courses;
}

// Function to add courses
export async function addCourses() {
  return await fetchCourses('add');
}

// Function to update courses
export async function updateCourses() {
  return await fetchCourses('update');
}

// Function to update all data (members and courses)
export async function updateAll() {
  await updateCourses();
  // Include other update functions if needed
}

// Function to search for courses
export async function search(input = '', year = new Date().getFullYear()) {
  // Implement your search logic here
}

// Export classes and functions (without duplicates)
export {
  Completion,
  CompletionRequest,
  Course,
  CourseRequest,
  // Other functions if needed
};
