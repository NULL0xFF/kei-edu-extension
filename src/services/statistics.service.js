/**
 * Statistics service - business logic and export
 */

import {CourseService} from './course.service.js';
import {MemberService} from './member.service.js';
import {logger} from '../core/error-handler.js';
import {formatDate, isDateInRange, parseDate} from '../utils/date.js';
import {downloadCSV, downloadExcel} from '../utils/file.js';

export class StatRecord {
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
    this.courses = courses;
  }

  addCourse(courseInfo) {
    this.courses.push(courseInfo);
  }

  getTotalCompletionTime() {
    return this.courses.reduce((total, course) => {
      if (course.csCompletionYn === 'Y') {
        return total + (course.csCmplTime || 0);
      }
      return total;
    }, 0);
  }

  getCompletedCourseCount() {
    return this.courses.filter(c => c.csCompletionYn === 'Y').length;
  }
}

export class StatisticsService {
  static async generateStats(options = {}) {
    try {
      logger.info('통계 생성 중...');

      const {
        keyword = '',
        startDate = null,
        endDate = null,
        year = new Date().getFullYear()
      } = options;

      // Parse dates
      let start = startDate ? parseDate(startDate) : null;
      let end = endDate ? parseDate(endDate) : null;

      if (start) {
        start = new Date(
            Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
        start = new Date(start.getTime() + start.getTimezoneOffset() * 60000);
      }

      if (end) {
        end = new Date(
            Date.UTC(end.getFullYear(), end.getMonth(), end.getDate()));
        end.setDate(end.getDate() + 1); // Include end date
        end = new Date(end.getTime() + end.getTimezoneOffset() * 60000);
      }

      logger.info(`날짜 범위: ${start || 'N/A'} ~ ${end || 'N/A'}`);

      // Load data
      const [allMembers, allCourses] = await Promise.all([
        MemberService.searchMembers({}),
        CourseService.searchCourses({year})
      ]);

      let targetMembers = allMembers;

      // Filter members
      if (keyword && keyword.trim() !== '') {
        logger.info(`키워드 "${keyword}"로 합집합 검색 중...`);
        const lowerKeyword = keyword.toLowerCase();
        const finalMemberSet = new Set(); // Store member sequences (csMemberSeq)

        // Condition 1 (Set 1): Members by organization
        allMembers.forEach(member => {
          if (member.belongsToOrganization(lowerKeyword)) {
            finalMemberSet.add(member.csMemberSeq);
          }
        });
        logger.info(`(조건 1) 소속/부서 일치: ${finalMemberSet.size}명`);

        // Condition 2 (Set 2): Members by course title
        const matchingCourses = allCourses.filter(course =>
            course.csTitle.toLowerCase().includes(lowerKeyword)
        );

        const set2MemberCount = new Set();
        if (matchingCourses.length > 0) {
          logger.info(
              `(조건 2) "${lowerKeyword}" 포함 과정 ${matchingCourses.length}개 발견`);
          // Find all members who took these courses
          matchingCourses.forEach(course => {
            course.csCmplList.forEach(completion => {
              finalMemberSet.add(completion.csMemberSeq);
              set2MemberCount.add(completion.csMemberSeq);
            });
          });
        }
        logger.info(`(조건 2) 과정 수강생: ${set2MemberCount.size}명`);

        // Create final list from the Set (Union)
        logger.info(`총 합집합 멤버: ${finalMemberSet.size}명`);
        targetMembers = allMembers.filter(
            member => finalMemberSet.has(member.csMemberSeq));
      } else {
        logger.info('키워드가 없으므로 전체 멤버를 대상으로 통계를 생성합니다.');
        // targetMembers is already allMembers
      }

      logger.info(
          `데이터 처리: 회원 ${targetMembers.length}명, 과정 ${allCourses.length}개`);

      // Generate records
      const records = [];

      for (const member of targetMembers) {
        const record = new StatRecord(member);

        for (const course of allCourses) {
          const completion = course.getCompletionByMember(member.csMemberSeq);

          if (!completion) {
            continue;
          }

          // Date filter
          if (start || end) {
            if (!completion.cxCompletionDate) {
              continue;
            }

            const completionDate = completion.cxCompletionDate;
            if (!isDateInRange(completionDate, start || new Date(0),
                end || new Date())) {
              continue;
            }
          }

          record.addCourse({
            csCourseActiveSeq: course.csCourseActiveSeq,
            csCourseMasterSeq: course.csCourseMasterSeq,
            csTitle: course.csTitle,
            csStatusCd: course.csStatusCd,
            csYear: course.csYear,
            csApplyStartDate: course.csApplyStartDate,
            csApplyEndDate: course.csApplyEndDate,
            csStudyStartDate: completion.csStudyStartDate,
            csStudyEndDate: course.csStudyEndDate,
            csOpenStartDate: course.csOpenStartDate,
            csOpenEndDate: course.csOpenEndDate,
            csCmplTime: course.csCmplTime,
            csTitlePath: course.csTitlePath,
            csCompletionYn: completion.csCompletionYn,
            cxCompletionDate: completion.cxCompletionDate
          });
        }

        if (record.courses.length > 0) {
          records.push(record);
        }
      }

      logger.info(`통계 레코드 생성 완료: ${records.length}건`);
      return records;
    } catch (error) {
      logger.error('Failed to generate statistics', error);
      throw error;
    }
  }

  static sortCourses(courses) {
    return courses.sort((a, b) => {
      // Customized courses first
      if (a.csTitlePath === '맞춤형' && b.csTitlePath !== '맞춤형') {
        return -1;
      }
      if (a.csTitlePath !== '맞춤형' && b.csTitlePath === '맞춤형') {
        return 1;
      }
      // Then alphabetically
      return a.csTitle.trim().localeCompare(b.csTitle.trim());
    });
  }

  static getUniqueCourses(records) {
    const coursesMap = new Map();
    records.forEach(record => {
      record.courses.forEach(course => {
        const key = course.csTitle.trim();
        if (!coursesMap.has(key)) {
          coursesMap.set(key, course);
        }
      });
    });
    return this.sortCourses(Array.from(coursesMap.values()));
  }

  static exportCSV(filename, records) {
    const courses = this.getUniqueCourses(records);

    const headers = [
      '아이디', '이름', '생년월일', '소속기관', '부서', '이메일',
      ...courses.map(c => c.csTitle.trim())
    ];

    const rows = [headers];

    records.forEach(record => {
      const row = [
        record.csMemberId,
        record.csMemberName,
        record.cxMemberBirthday || '',
        record.cxCompanyName || '',
        record.cxDepartmentName || '',
        record.cxMemberEmail || ''
      ];

      courses.forEach(course => {
        const trimmedTitle = course.csTitle.trim();

        const memberCourses = record.courses.filter(
            c => c.csTitle.trim() === trimmedTitle && c.csCompletionYn === 'Y'
        );

        if (memberCourses.length > 0) {
          const maxCompletionTime = Math.max(
              ...memberCourses.map(c => c.csCmplTime || 0)
          );
          row.push(String(maxCompletionTime));
        } else {
          row.push('0');
        }
      });

      rows.push(row);
    });

    downloadCSV(filename, rows);
  }

  static exportExcel(filename, records) {
    const courses = this.getUniqueCourses(records);

    const headers = [
      '아이디', '이름', '생년월일', '소속기관', '부서', '이메일',
      ...courses.map(c => c.csTitle.trim())
    ];

    const rows = [headers];

    records.forEach(record => {
      const row = [
        record.csMemberId,
        record.csMemberName,
        record.cxMemberBirthday || '',
        record.cxCompanyName || '',
        record.cxDepartmentName || '',
        record.cxMemberEmail || ''
      ];

      courses.forEach(course => {
        const trimmedTitle = course.csTitle.trim();

        const memberCourses = record.courses.filter(
            c => c.csTitle.trim() === trimmedTitle && c.csCompletionYn === 'Y'
        );

        if (memberCourses.length > 0) {
          const maxCompletionTime = Math.max(
              ...memberCourses.map(c => c.csCmplTime || 0)
          );
          row.push(maxCompletionTime);
        } else {
          row.push(0);
        }
      });

      rows.push(row);
    });

    downloadExcel(filename, rows);
  }

  static exportExcelWithDates(filename, records) {
    const courses = this.getUniqueCourses(records);

    const headers = [
      '아이디', '이름', '생년월일', '소속기관', '부서', '이메일',
      ...courses.flatMap(
          c => {
            const trimmedTitle = c.csTitle.trim();
            return [trimmedTitle, `${trimmedTitle} 시작일`, `${trimmedTitle} 종료일`];
          })
    ];

    const rows = [headers];

    records.forEach(record => {
      const row = [
        record.csMemberId,
        record.csMemberName,
        formatDate(parseDate(record.cxMemberBirthday), '-') || '',
        record.cxCompanyName || '',
        record.cxDepartmentName || '',
        record.cxMemberEmail || ''
      ];

      courses.forEach(course => {
        const trimmedTitle = course.csTitle.trim();

        const memberCourses = record.courses.filter(
            c => c.csTitle.trim() === trimmedTitle
                && c.csCompletionYn === 'Y'
                && c.cxCompletionDate
        );

        if (memberCourses.length > 0) {
          const bestCourse = memberCourses.reduce((max, current) => {
            return (current.csCmplTime || 0) > (max.csCmplTime || 0) ? current
                : max;
          });

          row.push(
              bestCourse.csCmplTime || 0,
              formatDate(parseDate(bestCourse.csStudyStartDate), '-') || '',
              formatDate(bestCourse.cxCompletionDate, '-') || ''
          );
        } else {
          row.push(0, '', '');
        }
      });

      rows.push(row);
    });

    downloadExcel(`${filename}_수료일자포함`, rows);
  }

  static getSummary(records) {
    const coursesSet = new Set();
    let totalCompletions = 0;
    let totalCompletionTime = 0;

    records.forEach(record => {
      record.courses.forEach(course => {
        coursesSet.add(course.csTitle.trim());

        if (course.csCompletionYn === 'Y') {
          totalCompletions++;
          totalCompletionTime += course.csCmplTime || 0;
        }
      });
    });

    return {
      totalMembers: records.length,
      totalCourses: coursesSet.size,
      totalCompletions,
      totalCompletionTime,
      averageCompletionTime: totalCompletions > 0
          ? Math.round(totalCompletionTime / totalCompletions)
          : 0,
      averageCompletionsPerMember: records.length > 0
          ? (totalCompletions / records.length).toFixed(2)
          : '0.00'
    };
  }
}
