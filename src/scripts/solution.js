import Logger from './logger.js';
import * as Course from './course.js';
import * as Member from './member.js';
import * as Utility from './utility.js';
import { addData } from "./storage";

const logger = new Logger('solution');

/**
 * Record class that contains member and course information
 * @class
 * @property {number} csMemberSeq - The member sequence number.
 * @property {string} csMemberId - The member ID.
 * @property {string} csMemberName - The member name.
 * @property {string} cxMemberBirthday - The member's birthday.
 * @property {string} cxMemberEmail - The member's email.
 * @property {string} cxCompanyName - The company name.
 * @property {string} cxDepartmentName - The department name.
 * @property {string} cxDivisionCdName - The division code name.
 * @property {string} csCertiType - The certification type.
 * @property {Array} courses - The list of courses.
 * @constructor
 * @param {Object} member - The member object.
 * @param {Array} [courses=[]] - The list of courses.
 */
class Record {
  constructor(member, courses = []) {
    this.csMemberSeq = member.csMemberSeq;
    this.csMemberId = member.csMemberId;
    this.csMemberName = member.csMemberName;
    this.cxMemberBirthday = member.cxMemberBirthday;
    this.cxMemberEmail = member.cxMemberEmail;
    this.cxCompanyName = member.cxCompanyName;
    this.cxDepartmentName = member.cxDepartmentName;
    this.cxDivisionCdName = member.cxDivisionCdName;
    this.csCertiType = member.csCertiType;
    this.courses = [];
    courses.forEach(course => {
      this.courses.push({
        csCourseActiveSeq: course.csCourseActiveSeq,
        csCourseMasterSeq: course.csCourseMasterSeq,
        csTitle: course.csTitle,
        csStatusCd: course.csStatusCd,
        csYear: course.csYear,
        csApplyStartDate: course.csApplyStartDate,
        csApplyEndDate: course.csApplyEndDate,
        csStudyStartDate: course.csStudyStartDate,
        csStudyEndDate: course.csStudyEndDate,
        csOpenStartDate: course.csOpenStartDate,
        csOpenEndDate: course.csOpenEndDate,
        csCmplTime: course.csCmplTime,
        csTitlePath: course.csTitlePath,
        csCompletionYn: course.csCmplList.find(
          completion => completion.csMemberSeq
            === member.csMemberSeq).csCompletionYn,
        cxCompletionDate: course.csCmplList.find(
          completion => completion.csMemberSeq
            === member.csMemberSeq).cxCompletionDate
      });
    });
  }
}

async function updateCourses({ signal }, year) {
  try {
    logger.info(`Starting course update for year: ${year}`, 'updateCourses');

    // Fetch all courses from the server
    const totalCourses = await Course.getTotalCourseCount({ signal });
    logger.debug(`Total course count fetched (unfiltered): ${totalCourses}`, 'updateCourses');
    const allCourses = await Course.getAllCourses({ signal }, totalCourses);
    logger.debug(`Fetched ${allCourses.length} courses (unfiltered)`, 'updateCourses');

    // Filter courses by the given year
    const courses = allCourses.filter(course => course.csYear == year);
    const totalFilteredCourses = courses.length;
    logger.info(`Processing ${totalFilteredCourses} courses for the year ${year}.`, 'updateCourses');

    for (const [index, course] of courses.entries()) {
      let isTimedout = false;
      const progress = `[${index + 1}/${totalFilteredCourses}]`;

      do {
        try {
          const totalChapters = await Course.getCourseChapterCount({ signal }, course.csCourseActiveSeq);
          const totalExams = await Course.getCourseExamCount({ signal }, course.csCourseActiveSeq);
          course.csCmplTime = totalChapters + totalExams;

          const totalCompletions = await Course.getCompletionCount({ signal }, course.csCourseActiveSeq);
          const completions = await Course.getAllCompletions({ signal }, course.csCourseActiveSeq, course.csCourseMasterSeq, totalCompletions);
          course.csCmplList = completions;
          if (completions.length !== totalCompletions) {
            logger.warn(`${progress} [${course.csCourseActiveSeq}] Mismatch in completions: expected ${totalCompletions}, got ${completions.length}`, 'updateCourses');
          }

          logger.debug(`${progress} [${course.csCourseActiveSeq}] Processed "${course.csTitle}"`, 'updateCourses');

          await Utility.sleep(100);
        } catch (error) {
          // if error is 'timeout', retry
          if (error === 'timeout') {
            isTimedout = true;
            logger.warn(`${progress} [${course.csCourseActiveSeq}] Timeout occurred, retrying...`, 'updateCourses');
          }
        }
      } while (isTimedout);
    }
    logger.debug(`All filtered courses processed`, 'updateCourses');

    await addData('courses', courses);
    logger.info('Course update completed', 'updateCourses');
  } catch (error) {
    if (error?.name === 'AbortError') {
      logger.warn('Course update aborted', 'updateCourses');
    } else {
      logger.error('Failed to update courses', 'updateCourses', error);
    }
  } finally {
    await Utility.sleep(1000);
  }
}

async function updateMembers({ signal }) {
  try {
    logger.info('Starting member update', 'updateMembers');

    const totalMembers = await Member.getActiveMemberCount({ signal });
    logger.debug(`Total active member count fetched: ${totalMembers}`, 'updateMembers');

    const members = await Member.getActiveMembers({ signal }, totalMembers);
    logger.debug(`Fetched ${members.length} active members`, 'updateMembers');

    await addData('members', members);
    logger.info('Member update completed', 'updateMembers');
  } catch (error) {
    if (error?.name === 'AbortError') {
      logger.warn('Member update aborted', 'updateMembers');
    } else {
      logger.error('Failed to update members', 'updateMembers', error);
    }
  } finally {
    await Utility.sleep(1000);
  }
}

async function getStatistic(event, input, start, end) {
  if (event) {
    event.target.innerHTML = '<span class="txt_white">진행중...</span>';
  }

  start = new Date(start);
  end = new Date(end);
  end = new Date(end.getDate() + 1);

  start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
  end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

  start = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
  end = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
  logger.debug(`Statistic range: ${start} to ${end}`, 'getStatistic');

  const courses = await Course.loadCourses('', start.getFullYear());
  const members = await Member.loadMembers();

  console.log(courses);
  console.log(members);

  const results = [];
  members.forEach(member => {
    // Completion instance has 'csMemberSeq', an identifier of Member class
    // Course instance has 'csCmplList', an array of Completion that indicate members
    courses.forEach(course => {
      const completions = course.csCmplList.filter(
        completion => completion.csMemberSeq === member.csMemberSeq);
      completions.forEach(completion => {
        // Check if results already have the member
        let record = results.find(
          result => result.csMemberSeq === member.csMemberSeq);
        if (!record) {
          record = new Record(member, [course]);
          results.push(record);
        } else {
          record.courses.push({
            csCourseActiveSeq: course.csCourseActiveSeq,
            csCourseMasterSeq: course.csCourseMasterSeq,
            csTitle: course.csTitle,
            csStatusCd: course.csStatusCd,
            csYear: course.csYear,
            csApplyStartDate: course.csApplyStartDate,
            csApplyEndDate: course.csApplyEndDate,
            csStudyStartDate: course.csStudyStartDate,
            csStudyEndDate: course.csStudyEndDate,
            csOpenStartDate: course.csOpenStartDate,
            csOpenEndDate: course.csOpenEndDate,
            csCmplTime: course.csCmplTime,
            csTitlePath: course.csTitlePath,
            csCompletionYn: completion.csCompletionYn,
            cxCompletionDate: completion.cxCompletionDate
          });
        }
      });
    });
  });
  /*
     * Filter the results that matches all the conditions. (AND operation)
     * 1. Matches any of the following conditions (OR operation):
     * A. Record.cxCompanyName contains input string. (cxCompanyName is nullable)
     * B. Record.cxDepartmentName contains input string. (cxDepartmentName is nullable)
     * C. Record.courses.csTitle contains input string.
     * 2. Matches the following condition:
     * A. Record.courses.cxCompletionDate is between start and end date.
     */
  const filteredResults = [];
  results.forEach(record => {
    // Check member attributes
    let memberMatched = false;
    if ((record.cxCompanyName && record.cxCompanyName.includes(input))
      || (record.cxDepartmentName && record.cxDepartmentName.includes(
        input))) {
      memberMatched = true;
    }
    // Check course attributes
    let courseMatched = false;
    record.courses.forEach(course => {
      if (course.csTitle.includes(input) && course.cxCompletionDate >= start
        && course.cxCompletionDate <= end) {
        courseMatched = true;
      }
    });
    if (memberMatched || courseMatched) {
      const coursesMatched = [];
      // Filter courses that is between start and end date
      record.courses.forEach(course => {
        if (course.cxCompletionDate >= start && course.cxCompletionDate
          <= end) {
          coursesMatched.push(course);
        }
      });
      // Clone record object.
      const filteredRecord = structuredClone(record);
      filteredRecord.courses = coursesMatched;
      filteredResults.push(filteredRecord);
    }
  });

  Utility.saveAsCSV(input, filteredResults);
  Utility.saveAsXLSX(input, filteredResults);
  Utility.saveAsXLSXWithDate(input, filteredResults);
}

async function onStatisticButtonClick(event) {
  if (event) {
    event.target.disabled = true;
  }
  const input = prompt('Enter search keyword', '');
  const start = prompt('Enter start date (yyyy-MM-dd)', new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
  const end = prompt('Enter end date (yyyy-MM-dd)', new Date().toISOString().split('T')[0]);

  if (!start || !end) {
    logger.warn('Input start date is invalid', 'injectUpdateButton');
    alert("Invalid input");
    return;
  }
  await getStatistic(event, input, start, end);

  if (event) {
    event.target.disabled = false;
  }
}

async function onUpdateButtonClick(event) {
  if (event) {
    event.target.disabled = true;
    event.target.innerHTML = '<span class="txt_white">진행중...</span>';
  }

  logger.info('Starting update process', 'onUpdateButtonClick');

  const year = prompt('Enter year (yyyy)', new Date().getFullYear());
  if (!year) {
    logger.warn('Input year is invalid', 'onUpdateButtonClick');
    alert("Invalid input");
    if (event) {
      event.target.disabled = false;
      event.target.innerHTML = '<span class="txt_white">업데이트</span>';
    }
    return;
  }

  const controller = new AbortController();
  const signal = controller.signal;

  try {
    event.target.innerHTML = '<span class="txt_white">회원정보...</span>';
    await updateMembers({ signal });
    event.target.innerHTML = '<span class="txt_white">과정정보...</span>';
    await updateCourses({ signal }, year);
  } catch (error) {
    if (error?.name === 'AbortError') {
      logger.warn('Update process aborted', 'onUpdateButtonClick');
    } else {
      logger.error('Error during update process', 'onUpdateButtonClick', error);
    }
  } finally {
    controller.abort();
  }

  logger.info('Update process finished', 'onUpdateButtonClick');
  if (event) {
    event.target.innerHTML = '<span class="txt_white">완료</span>';
    event.target.disabled = false;
  }
}

function injectUpdateButton() {
  if (window.location.href.includes('/user/member/memberList.do')) {
    let btn_rightArea = document.getElementsByClassName('btn_rightArea');

    if (btn_rightArea.length > 0) {
      let statisticButton = document.createElement('button');
      statisticButton.title = '통계';
      statisticButton.innerHTML = '<span class="txt_white">통계</span>';
      statisticButton.className = 'btn nor btn-blue';
      statisticButton.onclick = () => onStatisticButtonClick(event);

      let updateButton = document.createElement('button');
      updateButton.title = "업데이트";
      updateButton.innerHTML = '<span class="txt_white">업데이트</span>';
      updateButton.className = 'btn nor btn-gray';
      updateButton.onclick = () => onUpdateButtonClick(event);

      btn_rightArea[0].appendChild(statisticButton);
      btn_rightArea[0].appendChild(updateButton);
    } else {
      logger.warn('Button area not found', 'injectUpdateButton');
    }
  }
}

injectUpdateButton();