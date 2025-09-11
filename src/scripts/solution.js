import * as XLSX from "xlsx";
import { searchMembers, updateMembers } from "./member";
import { searchCourses, updateCourses } from "./course";
import { toLocalISOFormat, createLogger } from "./shared";

// Create logger for solution component
const logger = createLogger('SOLUTION');

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

async function updateAll() {
  logger.info('Starting update all operation');

  try {
    logger.info('Updating members...');
    await updateMembers();
    logger.info('Members update completed');

    logger.info('Updating courses...');
    await updateCourses();
    logger.info('Courses update completed');

    logger.info('Update all operation completed successfully');
  } catch (error) {
    logger.error('Failed to update all data', error);
    throw error;
  }
}

async function search(
  input = '',
  start = new Date(Date.UTC(new Date().getFullYear(), 0, 1)
    + new Date().getTimezoneOffset() * 60000),
  end = new Date(Date.UTC(new Date().getFullYear(), 11, 31)
    + new Date().getTimezoneOffset() * 60000)
) {
  logger.info(`Starting search operation with input: "${input}"`);

  try {
    // start and end date can be given as string format of local time 'yyyy.MM.dd' so it needs to be casted to Date object
    start = new Date(start);
    end = new Date(end);
    end.setDate(end.getDate() + 1);
    // Convert start and end to UTC format
    start = new Date(
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

    // Offset the start and end date to local time
    start = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
    end = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
    logger.info(`Search date range: ${start} to ${end}`);

    // Gather courses and members
    logger.info('Gathering courses and members data...');
    const courses = await searchCourses('', start.getFullYear());
    const members = await searchMembers();
    logger.info(`Found ${courses.length} courses and ${members.length} members`);

    // Join courses and members
    logger.debug('Building result records by joining courses and members...');
    const results = []; // Record[]
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

    logger.debug(`Created ${results.length} initial result records`);

    /*
     * Filter the results that matches all the conditions. (AND operation)
     * 1. Matches any of the following conditions (OR operation):
     *   A. Record.cxCompanyName contains input string. (cxCompanyName is nullable)
     *   B. Record.cxDepartmentName contains input string. (cxDepartmentName is nullable)
     *   C. Record.courses.csTitle contains input string.
     * 2. Matches the following condition:
     *   A. Record.courses.cxCompletionDate is between start and end date.
     */
    logger.debug('Filtering results based on search criteria...');
    const filteredResults = [];
    results.forEach(record => {
      // Check member attributes
      let memberMatched = false;
      if (
        (record.cxCompanyName && record.cxCompanyName.includes(input)) ||
        (record.cxDepartmentName && record.cxDepartmentName.includes(input))) {
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
            logger.debug(`Course match found - Title: ${course.csTitle}, Member: ${record.csMemberId}, Completion Date: ${course.cxCompletionDate}`);
            coursesMatched.push(course);
          }
        });
        // Clone record object.
        const filteredRecord = structuredClone(record);
        filteredRecord.courses = coursesMatched;
        filteredResults.push(filteredRecord);
      }
    });

    logger.info(`Filtered to ${filteredResults.length} matching records`);

    // Generate output files
    logger.info('Generating output files...');
    saveAsCSV(input, filteredResults);
    saveAsXLSX(input, filteredResults);
    saveAsXLSXWithDate(input, filteredResults);
    logger.info('Search operation completed successfully');
  } catch (error) {
    logger.error('Failed to complete search operation', error);
    throw error;
  }
}

function saveAsCSV(filename, results) {
  const csvLogger = createLogger('CSV_EXPORTER');
  csvLogger.info(`Generating CSV file: ${filename}`);

  try {
    const courses = [];
    results.forEach(result => {
      result.courses.forEach(course => {
        if (!courses.some(c => c.csCourseActiveSeq === course.csCourseActiveSeq
          && c.csCourseMasterSeq === course.csCourseMasterSeq)) {
          courses.push(course);
        }
      });
    });

    csvLogger.debug(`Found ${courses.length} unique courses for CSV export`);

    const csv = `${[
      '아이디',
      '이름',
      '생년월일',
      '소속기관',
      '부서',
      '이메일',
      ...courses.map(course => `${course.csTitle}`)
    ].join(',')}\n${results.map(result => {
      return `${[
        result.csMemberId,
        result.csMemberName,
        result.cxMemberBirthday,
        result.cxCompanyName,
        result.cxDepartmentName,
        result.cxMemberEmail,
        ...courses.map(course => {
          const completion = result.courses.find(
            c => c.csCourseActiveSeq === course.csCourseActiveSeq
              && c.csCourseMasterSeq === course.csCourseMasterSeq);
          if (completion) {
            // Completion Exists
            if (completion.csCompletionYn && completion.csCompletionYn == 'Y') {
              // Completed
              if (completion.cxCompletionDate) {
                return course.csCmplTime;
              } else {
                csvLogger.warn(`Completion date is missing for ${result.csMemberName} in ${course.csTitle}`);
                return 0;
              }
            } else {
              return 0;
            }
          } else {
            return 0;
          }
        })
      ].join(',')}`;
    }).join('\n')}`;

    // Add BOM for UTF-8 encoding
    const bom = '\uFEFF';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fullFileName = filename + "_" + toLocalISOFormat(new Date()) + '.csv';
    a.download = fullFileName;
    a.click();

    csvLogger.info(`Successfully saved CSV file: ${fullFileName}`);
  } catch (error) {
    csvLogger.error(`Failed to save CSV file: ${filename}`, error);
    throw error;
  }
}

function saveAsXLSX(filename, results) {
  const xlsxLogger = createLogger('XLSX_EXPORTER');
  xlsxLogger.info(`Generating XLSX file: ${filename}`);

  try {
    const courses = [];
    results.forEach(result => {
      result.courses.forEach(course => {
        if (!courses.some(c => c.csCourseActiveSeq === course.csCourseActiveSeq
          && c.csCourseMasterSeq === course.csCourseMasterSeq)) {
          courses.push(course);
        }
      });
    });

    xlsxLogger.debug(`Results: ${results.length}`);
    xlsxLogger.debug(`Courses: ${courses.length}`);

    // Sort courses by csTitle.
    // Priority: csTitlePath with data '맞춤형', csTitle string with trim.
    courses.sort((a, b) => {
      if (a.csTitlePath === '맞춤형' && b.csTitlePath !== '맞춤형') {
        return -1;
      } else if (a.csTitlePath !== '맞춤형' && b.csTitlePath === '맞춤형') {
        return 1;
      } else {
        return a.csTitle.trim().localeCompare(b.csTitle.trim());
      }
    });

    xlsxLogger.debug('Courses sorted by title and category');

    const ws = XLSX.utils.json_to_sheet([
      [
        '아이디',
        '이름',
        '생년월일',
        '소속기관',
        '부서',
        '이메일',
        ...courses.map(course => `${course.csTitle}`)
      ],
      ...results.map(result => {
        return [
          result.csMemberId,
          result.csMemberName,
          result.cxMemberBirthday,
          result.cxCompanyName,
          result.cxDepartmentName,
          result.cxMemberEmail,
          ...courses.map(course => {
            const completion = result.courses.find(
              c => c.csCourseActiveSeq === course.csCourseActiveSeq
                && c.csCourseMasterSeq === course.csCourseMasterSeq);
            if (completion) {
              // Completion Exists
              if (completion.csCompletionYn && completion.csCompletionYn == 'Y') {
                // Completed
                if (completion.cxCompletionDate) {
                  // Completion date exists
                  return course.csCmplTime;
                } else {
                  xlsxLogger.warn(`Completion date is missing for ${result.csMemberName} in ${course.csTitle}`);
                  return 0;
                }
              } else {
                return 0;
              }
            } else {
              return 0;
            }
          })
        ];
      })
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const fullFileName = filename + "_" + toLocalISOFormat(new Date()) + '.xlsx';
    XLSX.writeFile(wb, fullFileName);

    xlsxLogger.info(`Successfully saved XLSX file: ${fullFileName}`);
  } catch (error) {
    xlsxLogger.error(`Failed to save XLSX file: ${filename}`, error);
    throw error;
  }
}

function saveAsXLSXWithDate(filename, results) {
  const xlsxDateLogger = createLogger('XLSX_DATE_EXPORTER');
  xlsxDateLogger.info(`Generating XLSX file with dates: ${filename}`);

  try {
    const courses = [];
    results.forEach(result => {
      result.courses.forEach(course => {
        if (!courses.some(c => c.csCourseActiveSeq === course.csCourseActiveSeq
          && c.csCourseMasterSeq === course.csCourseMasterSeq)) {
          courses.push(course);
        }
      });
    });

    // Sort courses by csTitle.
    courses.sort((a, b) => {
      if (a.csTitlePath === '맞춤형' && b.csTitlePath !== '맞춤형') {
        return -1;
      } else if (a.csTitlePath !== '맞춤형' && b.csTitlePath === '맞춤형') {
        return 1;
      } else {
        return a.csTitle.trim().localeCompare(b.csTitle.trim());
      }
    });

    // Format the date string to 'yyyy-MM-dd'
    const formatDate = (dateString) => {
      if (!dateString) {
        return '';
      } // Handle null or undefined dates

      const parts = dateString.trim().split('.'); // Trim and split 'yyyy.MM.dd'

      if (parts.length !== 3) {
        xlsxDateLogger.warn(`Invalid date format: Expected 'yyyy.MM.dd', Received: ${dateString}`);
        return '';
      }

      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2,
        '0')}`; // Return 'yyyy-MM-dd'
    };

    const wsData = [
      [
        '아이디',
        '이름',
        '생년월일',
        '소속기관',
        '부서',
        '이메일',
        ...courses.flatMap(course => [
          `${course.csTitle}`,         // Course title header
          `${course.csTitle} 시작일`,  // Study start date header
          `${course.csTitle} 종료일`   // Study end date header
        ])
      ],
      ...results.map(result => [
        result.csMemberId,
        result.csMemberName,
        formatDate(result.cxMemberBirthday), // Format birthdate to 'yyyy-MM-dd'
        result.cxCompanyName,
        result.cxDepartmentName,
        result.cxMemberEmail,
        ...courses.flatMap(course => {
          const completion = result.courses.find(
            c => c.csCourseActiveSeq === course.csCourseActiveSeq
              && c.csCourseMasterSeq === course.csCourseMasterSeq);
          if (completion) {
            return [
              // Add course completion time
              completion.csCompletionYn === 'Y' && completion.cxCompletionDate
                ? course.csCmplTime : 0,
              // Add formatted study start date
              formatDate(course.csStudyStartDate),
              // Add formatted study end date
              new Date(completion.cxCompletionDate
                - (completion.cxCompletionDate.getTimezoneOffset() * 60
                  * 1000)).toISOString().split('T')[0]
            ];
          } else {
            return [0, '', '']; // Empty if no completion
          }
        })
      ])
    ];

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const fullFileName = filename + "_수료일자포함_" + toLocalISOFormat(new Date()) + '.xlsx';
    XLSX.writeFile(wb, fullFileName);

    xlsxDateLogger.info(`Successfully saved XLSX file with dates: ${fullFileName}`);
  } catch (error) {
    xlsxDateLogger.error(`Failed to save XLSX file with dates: ${filename}`, error);
    throw error;
  }
}

async function statistics(
  input = '',
  start = new Date(Date.UTC(new Date().getFullYear(), 0, 1)
    + new Date().getTimezoneOffset() * 60000),
  end = new Date(Date.UTC(new Date().getFullYear(), 11, 31)
    + new Date().getTimezoneOffset() * 60000)
) {
  const statsLogger = createLogger('STATISTICS');
  statsLogger.info(`Generating statistics with input: "${input}"`);

  try {
    // start and end date can be given as string format of local time 'yyyy.MM.dd' so it needs to be casted to Date object
    start = new Date(start);
    end = new Date(end);
    // Convert start and end to UTC fformat
    start = new Date(
      Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    end = new Date(Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));

    // Offset the start and end date to local time
    start = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
    end = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
    statsLogger.info(`Statistics date range: ${start} to ${end}`);

    // Gather courses and members
    statsLogger.info('Gathering data for statistics...');
    const courses = await searchCourses();
    const members = await searchMembers();
    statsLogger.info(`Found ${courses.length} courses and ${members.length} members for statistics`);

    // Join courses and members
    const results = []; // Record[]
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

    const statistics = {};
    results.forEach(record => {
      record.courses.forEach(course => {
        // if (course.csTitlePath !== '맞춤형') {
        if (course.csCompletionYn && course.csCompletionYn === 'Y') {
          if (statistics[record.cxDivisionCdName]) {
            statistics[record.cxDivisionCdName]++;
          } else {
            statistics[record.cxDivisionCdName] = 1;
          }
        }
        // }
      });
    });

    statsLogger.info('Statistics generated:', statistics);
  } catch (error) {
    statsLogger.error('Failed to generate statistics', error);
    throw error;
  }
}

let updateButton = document.createElement("button");

/**
 * Calculate estimated progress time
 * @param {number} current - Current number of data
 * @param {number} total - Total number of data
 * @param {Date} start - Start time
 * @param {string} title - Progress title (Optional)
 */
function estimatedProgressTime(current, total, start, title) {
  const progressLogger = createLogger('PROGRESS');

  const elapsed = Date.now() - start;
  const remaining = elapsed / current * (total - current);

  // Show in minutes and seconds if remaining time is more than 1 minute
  if (remaining > 60000) {
    const progressText = `${title} (ETC: ${Math.floor(remaining / 60000)}m ${Math.floor(
      (remaining % 60000) / 1000)}s)`;
    updateProgress(current / total, progressText);
    progressLogger.debug(`Progress: ${(current / total * 100).toFixed(2)}% - ${progressText}`);
  } else {
    const progressText = `${title} (ETC: ${Math.floor(remaining / 1000)}s)`;
    updateProgress(current / total, progressText);
    progressLogger.debug(`Progress: ${(current / total * 100).toFixed(2)}% - ${progressText}`);
  }
}

/**
 * Update progress of fetching data
 * @param {number} percent - Progress percentage
 * @param {string} title - Progress title (Optional)
 */
function updateProgress(percent, title) {
  // updateButton.innerHTML = `<span class=\"txt_white\">${percent}%</span>`;
  updateButton.innerHTML = `<span class=\"txt_white\">${title ? title + " : "
    : ""}${(percent * 100).toFixed(2)}%</span>`;
}

if (window.location.href.includes("user/member/memberList.do")) {
  logger.info('Member list page detected, initializing UI buttons');

  let btn_rightArea = document.getElementsByClassName("btn_rightArea");
  if (btn_rightArea.length > 0) {
    let statisticButton = document.createElement("button");
    statisticButton.title = "통계";
    statisticButton.innerHTML = "<span class=\"txt_white\">통계</span>";
    statisticButton.className = "btn nor btn-blue";
    statisticButton.onclick = async function () {
      logger.info('Statistics button clicked');

      const input = prompt("Enter search keyword", "");
      const start = prompt("Enter start date (yyyy-MM-dd)", "2024-01-01");
      const end = prompt("Enter end date (yyyy-MM-dd)", "2024-12-31");
      if (!start || !end) {
        logger.warn('Invalid input provided for statistics');
        alert("Invalid input");
        return;
      }

      try {
        statisticButton.disabled = true;
        statisticButton.innerHTML = "<span class=\"txt_white\">진행중...</span>";
        logger.info(`Starting search with params: input="${input}", start="${start}", end="${end}"`);
        await search(input, start, end);
        statisticButton.innerHTML = "<span class=\"txt_white\">완료</span>";
        logger.info('Statistics operation completed successfully');
      } catch (error) {
        logger.error('Statistics operation failed', error);
        statisticButton.innerHTML = "<span class=\"txt_white\">오류</span>";
        alert('오류가 발생했습니다. 콘솔을 확인해주세요.');
      } finally {
        statisticButton.disabled = false;
      }
    };

    updateButton.title = "업데이트";
    updateButton.innerHTML = "<span class=\"txt_white\">업데이트</span>";
    updateButton.className = "btn nor btn-gray";
    updateButton.onclick = async function () {
      logger.info('Update button clicked');

      try {
        updateButton.disabled = true;
        updateButton.innerHTML = "<span class=\"txt_white\">회원 진행중...</span>";
        logger.info('Starting members update');
        await updateMembers();
        updateButton.innerHTML = "<span class=\"txt_white\">과정 진행중...</span>";
        logger.info('Starting courses update');
        await updateCourses();
        updateButton.innerHTML = "<span class=\"txt_white\">완료</span>";
        logger.info('Update operation completed successfully');
      } catch (error) {
        logger.error('Update operation failed', error);
        updateButton.innerHTML = "<span class=\"txt_white\">오류</span>";
        alert('오류가 발생했습니다. 콘솔을 확인해주세요.');
      } finally {
        updateButton.disabled = false;
      }
    };

    btn_rightArea[0].appendChild(statisticButton);
    btn_rightArea[0].appendChild(updateButton);
    logger.info('UI buttons initialized successfully');
  } else {
    logger.error("Failed to find the button area");
  }
}

export { estimatedProgressTime };