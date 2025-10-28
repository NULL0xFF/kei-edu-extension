/**
 * @file stats.service.js
 * @description 통계 및 분석 비즈니스 로직
 */

import { CourseService } from './course.service.js';
import { MemberService } from './member.service.js';
import { logger } from '../core/error-handler.js';
import { parseDate, isDateInRange } from '../utils/date.js';

/**
 * 통계 레코드 모델
 */
export class StatRecord {
  constructor(member, courses = []) {
    // 회원 정보
    this.csMemberSeq = member.csMemberSeq;
    this.csMemberId = member.csMemberId;
    this.csMemberName = member.csMemberName;
    this.cxMemberBirthday = member.cxMemberBirthday;
    this.cxMemberEmail = member.cxMemberEmail;
    this.cxCompanyName = member.cxCompanyName;
    this.cxDepartmentName = member.cxDepartmentName;
    this.cxDivisionCdName = member.cxDivisionCdName;
    this.csCertiType = member.csCertiType;
    
    // 과정 정보
    this.courses = courses;
  }

  /**
   * 과정 추가
   * @param {Object} courseInfo - 과정 정보
   */
  addCourse(courseInfo) {
    this.courses.push(courseInfo);
  }

  /**
   * 총 이수 시간 계산
   * @returns {number}
   */
  getTotalCompletionTime() {
    return this.courses.reduce((total, course) => {
      if (course.csCompletionYn === 'Y') {
        return total + (course.csCmplTime || 0);
      }
      return total;
    }, 0);
  }

  /**
   * 수료한 과정 수
   * @returns {number}
   */
  getCompletedCourseCount() {
    return this.courses.filter(c => c.csCompletionYn === 'Y').length;
  }

  /**
   * 미수료 과정 수
   * @returns {number}
   */
  getIncompleteCourseCount() {
    return this.courses.filter(c => c.csCompletionYn !== 'Y').length;
  }
}

/**
 * 통계 서비스 클래스
 */
export class StatsService {
  /**
   * 통계 데이터 생성
   * @param {Object} options - 옵션
   * @returns {Promise<StatRecord[]>}
   */
  static async generateStats(options = {}) {
    try {
      logger.info('Generating statistics...');
      
      const {
        keyword = '',
        startDate = null,
        endDate = null,
        year = new Date().getFullYear(),
      } = options;
      
      // 회원 및 과정 데이터 로드
      const [members, courses] = await Promise.all([
        MemberService.searchMembers({ keyword }),
        CourseService.searchCourses({ year }),
      ]);
      
      logger.info(`Processing ${members.length} members and ${courses.length} courses`);
      
      // 통계 레코드 생성
      const records = [];
      
      for (const member of members) {
        const record = new StatRecord(member);
        
        // 각 과정에서 해당 회원의 수료 정보 찾기
        for (const course of courses) {
          const completion = course.getCompletionByMember(member.csMemberSeq);
          
          if (!completion) {
            continue;
          }
          
          // 날짜 필터 적용
          if (startDate || endDate) {
            if (!completion.cxCompletionDate) {
              continue;
            }
            
            const completionDate = parseDate(completion.cxCompletionDate);
            if (!completionDate) {
              continue;
            }
            
            const start = startDate ? parseDate(startDate) : new Date(0);
            const end = endDate ? parseDate(endDate) : new Date();
            
            if (!isDateInRange(completionDate, start, end)) {
              continue;
            }
          }
          
          // 과정 정보 추가
          record.addCourse({
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
            cxCompletionDate: completion.cxCompletionDate,
          });
        }
        
        // 과정이 있는 회원만 추가
        if (record.courses.length > 0) {
          records.push(record);
        }
      }
      
      logger.info(`Generated ${records.length} statistics records`);
      return records;
    } catch (error) {
      logger.error('Failed to generate statistics', error);
      throw error;
    }
  }

  /**
   * CSV 데이터 형식으로 변환
   * @param {StatRecord[]} records - 통계 레코드 배열
   * @returns {Array<Array<string>>}
   */
  static convertToCSVData(records) {
    // 모든 과정 목록 수집 (중복 제거)
    const coursesMap = new Map();
    records.forEach(record => {
      record.courses.forEach(course => {
        const key = `${course.csCourseActiveSeq}-${course.csCourseMasterSeq}`;
        if (!coursesMap.has(key)) {
          coursesMap.set(key, course);
        }
      });
    });
    
    const courses = Array.from(coursesMap.values());
    
    // 헤더 생성
    const headers = [
      '아이디',
      '이름',
      '생년월일',
      '소속기관',
      '부서',
      '이메일',
      ...courses.map(c => c.csTitle),
    ];
    
    // 데이터 행 생성
    const rows = [headers];
    
    records.forEach(record => {
      const row = [
        record.csMemberId,
        record.csMemberName,
        record.cxMemberBirthday || '',
        record.cxCompanyName || '',
        record.cxDepartmentName || '',
        record.cxMemberEmail || '',
      ];
      
      // 각 과정에 대한 이수 시간
      courses.forEach(course => {
        const key = `${course.csCourseActiveSeq}-${course.csCourseMasterSeq}`;
        const memberCourse = record.courses.find(
          c => `${c.csCourseActiveSeq}-${c.csCourseMasterSeq}` === key
        );
        
        if (memberCourse && memberCourse.csCompletionYn === 'Y') {
          row.push(String(memberCourse.csCmplTime || 0));
        } else {
          row.push('0');
        }
      });
      
      rows.push(row);
    });
    
    return rows;
  }

  /**
   * Excel 데이터 형식으로 변환
   * @param {StatRecord[]} records - 통계 레코드 배열
   * @returns {Array<Object>}
   */
  static convertToExcelData(records) {
    // 모든 과정 목록 수집
    const coursesMap = new Map();
    records.forEach(record => {
      record.courses.forEach(course => {
        const key = `${course.csCourseActiveSeq}-${course.csCourseMasterSeq}`;
        if (!coursesMap.has(key)) {
          coursesMap.set(key, course);
        }
      });
    });
    
    const courses = Array.from(coursesMap.values());
    
    // 데이터 배열 생성
    const data = records.map(record => {
      const row = {
        '아이디': record.csMemberId,
        '이름': record.csMemberName,
        '생년월일': record.cxMemberBirthday || '',
        '소속기관': record.cxCompanyName || '',
        '부서': record.cxDepartmentName || '',
        '이메일': record.cxMemberEmail || '',
      };
      
      // 각 과정에 대한 이수 시간
      courses.forEach(course => {
        const key = `${course.csCourseActiveSeq}-${course.csCourseMasterSeq}`;
        const memberCourse = record.courses.find(
          c => `${c.csCourseActiveSeq}-${c.csCourseMasterSeq}` === key
        );
        
        if (memberCourse && memberCourse.csCompletionYn === 'Y') {
          row[course.csTitle] = memberCourse.csCmplTime || 0;
        } else {
          row[course.csTitle] = 0;
        }
      });
      
      return row;
    });
    
    return data;
  }

  /**
   * 요약 통계 생성
   * @param {StatRecord[]} records - 통계 레코드 배열
   * @returns {Object}
   */
  static getSummary(records) {
    const summary = {
      totalMembers: records.length,
      totalCourses: 0,
      totalCompletions: 0,
      totalCompletionTime: 0,
      averageCompletionTime: 0,
      averageCompletionsPerMember: 0,
    };
    
    // 고유 과정 수 계산
    const coursesSet = new Set();
    records.forEach(record => {
      record.courses.forEach(course => {
        coursesSet.add(`${course.csCourseActiveSeq}-${course.csCourseMasterSeq}`);
        
        if (course.csCompletionYn === 'Y') {
          summary.totalCompletions++;
          summary.totalCompletionTime += course.csCmplTime || 0;
        }
      });
    });
    
    summary.totalCourses = coursesSet.size;
    
    // 평균 계산
    if (summary.totalCompletions > 0) {
      summary.averageCompletionTime = 
        Math.round(summary.totalCompletionTime / summary.totalCompletions);
    }
    
    if (summary.totalMembers > 0) {
      summary.averageCompletionsPerMember = 
        (summary.totalCompletions / summary.totalMembers).toFixed(2);
    }
    
    return summary;
  }
}
