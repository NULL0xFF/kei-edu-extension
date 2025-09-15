import * as XLSX from "xlsx";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getCSRFToken() {
  return document.querySelector('meta[name="_csrf"]').getAttribute('content');
}

function ajaxJSON(opts, {
  timeout = 500,              // per-attempt timeout
  retries = 6,                // number of retries (total attempts = 1 + retries)
  retryInitialDelayMs = 1000, // 1s
  retryFactor = 2,            // 1s, 2s, 4s, 8s, ...
  retryCapMs = 16000,         // cap a single wait (e.g., 16s)
  totalBudgetMs = Infinity,   // optional overall budget
  withCredentials = true,
  signal,
} = {}) {
  return new Promise((resolve, reject) => {
    let attempt = 0;      // 0-based; first failure -> attempt=1 -> delay=1s
    let jq;               // current jqXHR
    const t0 = Date.now();

    const abort = () => {
      try {
        jq?.abort();
      } catch {
      }
      reject(new DOMException('Aborted', 'AbortError'));
    };
    if (signal) {
      if (signal.aborted) return abort();
      signal.addEventListener('abort', abort, {once: true});
    }

    const run = async () => {
      jq = $.ajax({
        ...opts,
        dataType: opts.dataType || 'json',
        timeout,
        xhrFields: {withCredentials},
      })
        .done(data => resolve(data))
        .fail(async (jqXHR, textStatus, errorThrown) => {
          const status = jqXHR?.status;
          const retriable = textStatus === 'timeout' || textStatus === 'error' ||
            [0, 429, 500, 502, 503, 504].includes(status);

          if (!retriable || attempt >= retries || signal?.aborted) {
            const err = new Error(errorThrown || textStatus || 'AJAX failed');
            err.status = status;
            err.textStatus = textStatus;
            return reject(err);
          }

          attempt++;

          // Compute exponential delay: 1s, 2s, 4s, ...
          const retryAfterHdr = Number(jqXHR?.getResponseHeader?.('Retry-After'));
          const expDelay = Math.min(retryCapMs, retryInitialDelayMs * (retryFactor ** (attempt - 1)));
          // If server asks to wait longer, respect it
          let delay = Number.isFinite(retryAfterHdr) ? Math.max(expDelay, retryAfterHdr * 1000) : expDelay;

          // Respect overall budget if set
          const elapsed = Date.now() - t0;
          if (elapsed + delay > totalBudgetMs) {
            delay = Math.max(0, totalBudgetMs - elapsed);
          }

          if (delay > 0) await sleep(delay);
          if (Date.now() - t0 >= totalBudgetMs) {
            const err = new Error('Retry budget exceeded');
            err.textStatus = 'timeout';
            return reject(err);
          }

          run();
        });
    };
    run();
  });
}

function toLocalISOFormat(date) {
  const localISODate = date.toISOString().slice(0, 19); // Remove the 'Z' at the end
  const timezoneOffset = -date.getTimezoneOffset();
  const offsetSign = timezoneOffset >= 0 ? '+' : '-';
  const offsetHours = String(
    Math.floor(Math.abs(timezoneOffset) / 60)).padStart(2, '0');
  const offsetMinutes = String(Math.abs(timezoneOffset) % 60).padStart(2, '0');

  return `${localISODate}${offsetSign}${offsetHours}:${offsetMinutes}`;
}

function saveAsJSON(fileName, data) {
  const fileContent = JSON.stringify(data);
  const bb = new Blob([fileContent], {type: "text/plain"});
  const a = document.createElement("a");

  a.download = fileName + "_" + toLocalISOFormat(new Date()) + ".json";
  a.href = window.URL.createObjectURL(bb);
  a.click();
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

  const csv = `${['아이디', '이름', '생년월일', '소속기관', '부서', '이메일',
    ...courses.map(course => `${course.csTitle}`)].join(',')}\n${results.map(
    result => {
      return `${[result.csMemberId, result.csMemberName,
        result.cxMemberBirthday, result.cxCompanyName,
        result.cxDepartmentName, result.cxMemberEmail,
        ...courses.map(course => {
          const completion = result.courses.find(
            c => c.csCourseActiveSeq === course.csCourseActiveSeq
              && c.csCourseMasterSeq === course.csCourseMasterSeq);
          if (completion) {
            // Completion Exists
            if (completion.csCompletionYn && completion.csCompletionYn
              === 'Y') {
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
        })].join(',')}`;
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

  const ws = XLSX.utils.json_to_sheet(
    [['아이디', '이름', '생년월일', '소속기관', '부서', '이메일',
      ...courses.map(course => `${course.csTitle}`)],
      ...results.map(result => {
        return [result.csMemberId, result.csMemberName,
          result.cxMemberBirthday, result.cxCompanyName,
          result.cxDepartmentName, result.cxMemberEmail,
          ...courses.map(course => {
            const completion = result.courses.find(
              c => c.csCourseActiveSeq === course.csCourseActiveSeq
                && c.csCourseMasterSeq === course.csCourseMasterSeq);
            if (completion) {
              // Completion Exists
              if (completion.csCompletionYn && completion.csCompletionYn
                === 'Y') {
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
          })];
      })]);

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

    const parts = dateString.trim().split('.'); // Trim and split 'yyyy.MM.dd'

    if (parts.length !== 3) {
      console.info(
        `Invalid date format: Expected 'yyyy.MM.dd'\n Received: ${dateString}`);
      return '';
    }

    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2,
      '0')}`; // Return 'yyyy-MM-dd'
  };

  const wsData = [['아이디', '이름', '생년월일', '소속기관', '부서', '이메일', ...courses.flatMap(
    course => [`${course.csTitle}`,         // Course title header
      `${course.csTitle} 시작일`,  // Study start date header
      `${course.csTitle} 종료일`   // Study end date header
    ])], ...results.map(result => [result.csMemberId, result.csMemberName,
    formatDate(result.cxMemberBirthday), // Format birthdate to 'yyyy-MM-dd'
    result.cxCompanyName, result.cxDepartmentName, result.cxMemberEmail,
    ...courses.flatMap(course => {
      const completion = result.courses.find(
        c => c.csCourseActiveSeq === course.csCourseActiveSeq
          && c.csCourseMasterSeq === course.csCourseMasterSeq);
      if (completion) {
        return [// Add course completion time
          completion.csCompletionYn === 'Y' && completion.cxCompletionDate
            ? course.csCmplTime : 0, // Add formatted study start date
          formatDate(course.csStudyStartDate), // Add formatted study end date
          new Date(completion.cxCompletionDate
            - (completion.cxCompletionDate.getTimezoneOffset() * 60
              * 1000)).toISOString().split('T')[0]];
      } else {
        return [0, '', '']; // Empty if no completion
      }
    })])];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  XLSX.writeFile(wb,
    filename + "_수료일자포함_" + toLocalISOFormat(new Date()) + '.xlsx');
}

export {
  sleep,
  getCSRFToken,
  ajaxJSON,
  toLocalISOFormat,
  saveAsJSON,
  saveAsCSV,
  saveAsXLSX,
  saveAsXLSXWithDate
}