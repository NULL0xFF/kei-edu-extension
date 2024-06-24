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
                csCompletionYn: course.csCmplList.find(completion => completion.csMemberSeq === member.csMemberSeq).csCompletionYn,
                cxCompletionDate: course.csCmplList.find(completion => completion.csMemberSeq === member.csMemberSeq).cxCompletionDate
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
    start = new Date(Date.UTC(new Date().getFullYear(), 0, 1) + new Date().getTimezoneOffset() * 60000),
    end = new Date(Date.UTC(new Date().getFullYear(), 11, 31) + new Date().getTimezoneOffset() * 60000)
) {
    // start and end date can be given as string format of local time 'yyyy.MM.dd' so it needs to be casted to Date object
    start = new Date(start);
    end = new Date(end);
    end.setDate(end.getDate() + 1);
    // Convert start and end to UTC format
    start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
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
            const completions = course.csCmplList.filter(completion => completion.csMemberSeq === member.csMemberSeq);
            completions.forEach(completion => {
                // Check if results already have the member
                let record = results.find(result => result.csMemberSeq === member.csMemberSeq);
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

    // Filter the results that matches all the conditions. (AND operation)
    // 1. Matches any of the following conditions (OR operation):
    //   A. Record.cxCompanyName contains input string. (cxCompanyName is nullable)
    //   B. Record.cxDepartmentName contains input string. (cxDepartmentName is nullable)
    //   C. Record.courses.csTitle contains input string.
    // 2. Matches the following condition:
    //   A. Record.courses.cxCompletionDate is between start and end date.
    const filteredResults = [];
    results.forEach(record => {
        // Check member attributes
        var memberMatched = false;
        if (
            (record.cxCompanyName && record.cxCompanyName.includes(input)) ||
            (record.cxDepartmentName && record.cxDepartmentName.includes(input))) {
            memberMatched = true;
        }
        // Check course attributes
        var courseMatched = false;
        record.courses.forEach(course => {
            if (course.csTitle.includes(input) && course.cxCompletionDate >= start && course.cxCompletionDate <= end) {
                courseMatched = true;
            }
        });
        if (memberMatched || courseMatched) {
            var coursesMatched = [];
            // Filter courses that is between start and end date
            record.courses.forEach(course => {
                if (course.cxCompletionDate >= start && course.cxCompletionDate <= end) {
                    // console.log(`Course Title: ${course.csTitle}\nMember ID: ${record.csMemberId}\nCompletion Date: ${course.cxCompletionDate}`);
                    coursesMatched.push(course);
                }
            });
            // Clone record object.
            var filteredRecord = structuredClone(record);
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
}

function saveAsCSV(filename, results) {
    const courses = [];
    results.forEach(result => {
        result.courses.forEach(course => {
            if (!courses.some(c => c.csCourseActiveSeq === course.csCourseActiveSeq && c.csCourseMasterSeq === course.csCourseMasterSeq)) {
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
                const completion = result.courses.find(c => c.csCourseActiveSeq === course.csCourseActiveSeq && c.csCourseMasterSeq === course.csCourseMasterSeq);
                if (completion) {
                    // Completion Exists
                    if (completion.csCompletionYn && completion.csCompletionYn == 'Y') {
                        // Completed
                        if (completion.cxCompletionDate) {
                            // console.debug(`Search Start Date: ${course.csStudyStartDate}\nSearch End Date: ${course.csStudyEndDate}\nCompletion Date: ${completion.cxCompletionDate}`);
                            // Completion date exists
                            return course.csCmplTime;
                        } else {
                            console.error(`Completion date is missing for ${result.csMemberName} in ${course.csTitle}`);
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
    a.download = filename + "_" + toLocalISOFormat(new Date()) + '.csv';
    a.click();
}

function saveAsXLSX(filename, results) {
    const courses = [];
    results.forEach(result => {
        result.courses.forEach(course => {
            if (!courses.some(c => c.csCourseActiveSeq === course.csCourseActiveSeq && c.csCourseMasterSeq === course.csCourseMasterSeq)) {
                courses.push(course);
            }
        });
    });

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
        ...results.map(result => [
            result.csMemberId,
            result.csMemberName,
            result.cxMemberBirthday,
            result.cxCompanyName,
            result.cxDepartmentName,
            result.cxMemberEmail,
            ...courses.map(course => {
                const completion = result.courses.find(c => c.csCourseActiveSeq === course.csCourseActiveSeq && c.csCourseMasterSeq === course.csCourseMasterSeq);
                if (completion) {
                    // Completion Exists
                    if (completion.csCompletionYn && completion.csCompletionYn == 'Y') {
                        // Completed
                        if (completion.cxCompletionDate) {
                            // Completion date exists
                            return course.csCmplTime;
                        } else {
                            console.error(`Completion date is missing for ${result.csMemberName} in ${course.csTitle}`);
                            return 0;
                        }
                    } else {
                        return 0;
                    }
                } else {
                    return 0;
                }
            })
        ])
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename + "_" + toLocalISOFormat(new Date()) + '.xlsx');
}

async function statistics(
    input = '',
    start = new Date(Date.UTC(new Date().getFullYear(), 0, 1) + new Date().getTimezoneOffset() * 60000),
    end = new Date(Date.UTC(new Date().getFullYear(), 11, 31) + new Date().getTimezoneOffset() * 60000)
) {
    // start and end date can be given as string format of local time 'yyyy.MM.dd' so it needs to be casted to Date object
    start = new Date(start);
    end = new Date(end);
    // Convert start and end to UTC format
    start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
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
            const completions = course.csCmplList.filter(completion => completion.csMemberSeq === member.csMemberSeq);
            completions.forEach(completion => {
                // Check if results already have the member
                let record = results.find(result => result.csMemberSeq === member.csMemberSeq);
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

if (window.location.href.includes("user/member/memberList.do")) {
    btn_rightArea = document.getElementsByClassName("btn_rightArea");
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

        let updateButton = document.createElement("button");
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