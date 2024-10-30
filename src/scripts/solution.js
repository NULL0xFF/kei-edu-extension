import * as XLSX from "xlsx";

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
  await updateMembers();
  await updateCourses();
}

async function search(
    input = '',
    start = new Date(Date.UTC(new Date().getFullYear(), 0, 1)
        + new Date().getTimezoneOffset() * 60000),
    end = new Date(Date.UTC(new Date().getFullYear(), 11, 31)
        + new Date().getTimezoneOffset() * 60000)
) {
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
  console.log(`Start date: ${start}\nEnd date: ${end}`);

  // Gather courses and members
  const courses = await searchCourses('', start.getFullYear());
  const members = await searchMembers();

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

  /*
   * Filter the results that matches all the conditions. (AND operation)
   * 1. Matches any of the following conditions (OR operation):
   *   A. Record.cxCompanyName contains input string. (cxCompanyName is nullable)
   *   B. Record.cxDepartmentName contains input string. (cxDepartmentName is nullable)
   *   C. Record.courses.csTitle contains input string.
   * 2. Matches the following condition:
   *   A. Record.courses.cxCompletionDate is between start and end date.
   */
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
          // console.log(`Course Title: ${course.csTitle}\nMember ID: ${record.csMemberId}\nCompletion Date: ${course.cxCompletionDate}`);
          coursesMatched.push(course);
        }
      });
      // Clone record object.
      const filteredRecord = structuredClone(record);
      filteredRecord.courses = coursesMatched;
      filteredResults.push(filteredRecord);
    }
  });

  // const filteredResults = results.filter(result => {
  //     return (
  //         (result.cxCompanyName && result.cxCompanyName.includes(input)) ||
  //         (result.cxDepartmentName && result.cxDepartmentName.includes(input)) ||
  //         result.courses.some(course => course.csTitle.includes(input))
  //     ) && result.courses.some(course => {
  //         // TODO: Add local time offset to start and end date before comparison
  //         const completionDate = course.cxCompletionDate;
  //         if (result.csMemberId == 'vvk1107') {
  //             console.log(`Course Title: ${course.csTitle}\nMember ID: ${result.csMemberId}\nCompletion Date: ${completionDate}`);
  //         }
  //         return completionDate >= start && completionDate <= end;
  //     });
  // });

  saveAsCSV(input, filteredResults);
  saveAsXLSX(input, filteredResults);
  saveAsXLSXWithDate(input, filteredResults);
}

function saveAsCSV(filename, results) {
  const courses = [];
  results.forEach(result => {
    result.courses.forEach(course => {
      if (!courses.some(c => c.csCourseActiveSeq === course.csCourseActiveSeq
          && c.csCourseMasterSeq === course.csCourseMasterSeq)) {
        courses.push(course);
      }
    });
  });

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
              // console.debug(`Search Start Date: ${course.csStudyStartDate}\nSearch End Date: ${course.csStudyEndDate}\nCompletion Date: ${completion.cxCompletionDate}`);
              // Completion date exists
              return course.csCmplTime;
            } else {
              console.error(
                  `Completion date is missing for ${result.csMemberName} in ${course.csTitle}`);
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
  const blob = new Blob([bom + csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename + "_" + toLocalISOFormat(new Date()) + '.csv';
  a.click();
}

function saveAsXLSX(filename, results) {
  const courses = [];
  results.forEach(result => {
    result.courses.forEach(course => {
      if (!courses.some(c => c.csCourseActiveSeq === course.csCourseActiveSeq
          && c.csCourseMasterSeq === course.csCourseMasterSeq)) {
        courses.push(course);
      }
    });
  });

  console.debug(`Results: ${results.length}`);
  console.debug(`Courses: ${courses.length}`);

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
                console.error(
                    `Completion date is missing for ${result.csMemberName} in ${course.csTitle}`);
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
  XLSX.writeFile(wb, filename + "_" + toLocalISOFormat(new Date()) + '.xlsx');
}

function saveAsXLSXWithDate(filename, results) {
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
    const parts = dateString.split('.'); // Split 'yyyy.MM.dd'
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
  XLSX.writeFile(wb,
      filename + "_수료일자포함_" + toLocalISOFormat(new Date()) + '.xlsx');
}

async function statistics(
    input = '',
    start = new Date(Date.UTC(new Date().getFullYear(), 0, 1)
        + new Date().getTimezoneOffset() * 60000),
    end = new Date(Date.UTC(new Date().getFullYear(), 11, 31)
        + new Date().getTimezoneOffset() * 60000)
) {
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
  console.log(`Start date: ${start}\nEnd date: ${end}`);

  // Gather courses and members
  const courses = await searchCourses();
  const members = await searchMembers();

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

  console.log(statistics);
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
  const elapsed = Date.now() - start;
  const remaining = elapsed / current * (total - current);
  // Show in minutes and seconds if remaining time is more than 1 minute
  if (remaining > 60000) {
    updateProgress(current / total,
        `${title} (ETC: ${Math.floor(remaining / 60000)}m ${Math.floor(
            (remaining % 60000) / 1000)}s)`);
  } else {
    updateProgress(current / total,
        `${title} (ETC: ${Math.floor(remaining / 1000)}s)`);
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
  let btn_rightArea = document.getElementsByClassName("btn_rightArea");
  if (btn_rightArea.length > 0) {
    let statisticButton = document.createElement("button");
    statisticButton.title = "통계";
    statisticButton.innerHTML = "<span class=\"txt_white\">통계</span>";
    statisticButton.className = "btn nor btn-blue";
    statisticButton.onclick = async function () {
      const input = prompt("Enter search keyword", "");
      const start = prompt("Enter start date (yyyy-MM-dd)", "2024-01-01");
      const end = prompt("Enter end date (yyyy-MM-dd)", "2024-12-31");
      if (!start || !end) {
        alert("Invalid input");
        return;
      }
      statisticButton.disabled = true;
      statisticButton.innerHTML = "<span class=\"txt_white\">진행중...</span>";
      await search(input, start, end);
      statisticButton.innerHTML = "<span class=\"txt_white\">완료</span>";
      statisticButton.disabled = false;
    };

    updateButton.title = "업데이트";
    updateButton.innerHTML = "<span class=\"txt_white\">업데이트</span>";
    updateButton.className = "btn nor btn-gray";
    updateButton.onclick = async function () {
      updateButton.disabled = true;
      updateButton.innerHTML = "<span class=\"txt_white\">회원 진행중...</span>";
      await updateMembers();
      updateButton.innerHTML = "<span class=\"txt_white\">과정 진행중...</span>";
      await updateCourses();
      updateButton.innerHTML = "<span class=\"txt_white\">완료</span>";
      updateButton.disabled = false;
    };
    btn_rightArea[0].appendChild(statisticButton);
    btn_rightArea[0].appendChild(updateButton);
  } else {
    console.error("Failed to find the button area.");
  }
}