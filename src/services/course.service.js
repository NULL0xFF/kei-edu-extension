/**
 * @file course.service.js
 * @description 과정 비즈니스 로직
 */

import { CourseApi } from '../api/course.api.js';
import { storage } from '../core/storage.js';
import { STORAGE_KEY, COURSE } from '../config/constants.js';
import { logger } from '../core/error-handler.js';
import { ProgressTracker } from '../utils/progress.js';

/**
 * 과정 모델
 */
export class Course {
  constructor(data) {
    this.csCourseActiveSeq = data.csCourseActiveSeq;
    this.csCourseMasterSeq = data.csCourseMasterSeq;
    this.csTitle = data.csTitle;
    this.csStatusCd = data.csStatusCd;
    this.csCourseTypeCd = data.csCourseTypeCd;
    this.csYear = data.csYear;
    this.csApplyStartDate = data.csApplyStartDate;
    this.csApplyEndDate = data.csApplyEndDate;
    this.csStudyStartDate = data.csStudyStartDate;
    this.csStudyEndDate = data.csStudyEndDate;
    this.csOpenStartDate = data.csOpenStartDate;
    this.csOpenEndDate = data.csOpenEndDate;
    this.csCmplTime = data.csCmplTime || 0;
    this.csTitlePath = data.csTitlePath;
    this.csCmplList = data.csCmplList || [];
  }

  /**
   * 과정이 활성 상태인지 확인
   * @returns {boolean}
   */
  isActive() {
    return this.csStatusCd === 'active';
  }

  /**
   * 과정이 상시제인지 확인
   * @returns {boolean}
   */
  isAlways() {
    return this.csCourseTypeCd === 'always';
  }

  /**
   * 과정이 기수제인지 확인
   * @returns {boolean}
   */
  isPeriod() {
    return this.csCourseTypeCd === 'period';
  }

  isCustomized() {
    return this.csTitlePath === '맞춤형';
  }

  /**
   * 특정 회원의 수료 정보 조회
   * @param {number} memberSeq - 회원 시퀀스
   * @returns {Object|null}
   */
  getCompletionByMember(memberSeq) {
    return this.csCmplList.find(c => c.csMemberSeq === memberSeq) || null;
  }

  /**
   * 수료한 회원 수 조회
   * @returns {number}
   */
  getCompletedCount() {
    return this.csCmplList.filter(c => c.csCompletionYn === 'Y').length;
  }
}

/**
 * 과정 서비스 클래스
 */
export class CourseService {
  /**
   * 모든 과정 데이터 가져오기 (상세 정보 포함) - 로직 수정
   * @param {number | null} filterYear - 상세 정보를 가져올 연도. null이면 모든 과정의 상세 정보를 가져옴.
   * @returns {Promise<Course[]>}
   */
  static async fetchAllCourses(filterYear = null) {
    try {
      logger.info('Fetching all course list...');

      const totalCount = await CourseApi.getTotalCount();
      logger.info(`Total courses found on server: ${totalCount}`);

      if (totalCount === 0) {
        return [];
      }

      let coursesData = await CourseApi.getAllCourses(totalCount);
      logger.info(`Fetched ${coursesData.length} courses from server`);

      if (filterYear) {
        const originalCount = coursesData.length;
        coursesData = coursesData.filter(course => course.csYear == filterYear);
        logger.info(`Filtered courses for year ${filterYear}. Kept ${coursesData.length} out of ${originalCount}.`);
      }

      const progress = new ProgressTracker(coursesData.length, `${filterYear || '전체'}년 과정 상세 정보 업데이트`);

      const courses = [];
      for (let i = 0; i < coursesData.length; i++) {
        const courseData = coursesData[i];

        try {
          // 차시 및 시험 수 조회로 이수 시간 계산
          const [classCount, examCount] = await Promise.all([
            CourseApi.getElementCount(courseData.csCourseActiveSeq, COURSE.ELEMENT_TYPE.ORGANIZATION),
            CourseApi.getElementCount(courseData.csCourseActiveSeq, COURSE.ELEMENT_TYPE.EXAM),
          ]);
          courseData.csCmplTime = classCount + examCount;

          // 수료 정보 조회
          const completionCount = await CourseApi.getCompletionCount(
            courseData.csCourseActiveSeq
          );

          if (completionCount > 0) {
            const completions = await CourseApi.getCompletions(
              courseData.csCourseActiveSeq,
              completionCount
            );

            // 수강 신청 정보 조회하여 학습 시작일 매핑
            const applications = await CourseApi.getApplications(
              courseData.csCourseActiveSeq,
              courseData.csCourseMasterSeq,
              completionCount
            );

            const startDateMap = new Map();
            applications.forEach(app => {
              startDateMap.set(app.csMemberSeq, app.csStudyStartDate);
            });

            completions.forEach(comp => {
              comp.csStudyStartDate = startDateMap.get(comp.csMemberSeq) || null;
            });

            courseData.csCmplList = completions;
          }

          courses.push(new Course(courseData));

        } catch (error) {
          logger.error(
            `Failed to fetch details for course ${courseData.csTitle}`,
            error
          );
          // 에러가 발생하더라도 기본 정보는 추가
          courses.push(new Course(courseData));
        } finally {
          progress.update(i + 1);
        }
      }

      progress.complete();
      return courses;
    } catch (error) {
      logger.error('Failed to fetch courses', error);
      throw error;
    }
  }

  /**
   * 과정 데이터를 스토리지에 저장
   * @param {Course[]} courses - 과정 목록
   * @returns {Promise<void>}
   */
  static async saveCourses(courses) {
    try {
      logger.info('Saving courses to storage...');
      const coursesData = courses.map(c => ({
        csCourseActiveSeq: c.csCourseActiveSeq,
        csCourseMasterSeq: c.csCourseMasterSeq,
        csTitle: c.csTitle,
        csStatusCd: c.csStatusCd,
        csCourseTypeCd: c.csCourseTypeCd,
        csYear: c.csYear,
        csApplyStartDate: c.csApplyStartDate,
        csApplyEndDate: c.csApplyEndDate,
        csStudyStartDate: c.csStudyStartDate,
        csStudyEndDate: c.csStudyEndDate,
        csOpenStartDate: c.csOpenStartDate,
        csOpenEndDate: c.csOpenEndDate,
        csCmplTime: c.csCmplTime,
        csTitlePath: c.csTitlePath,
        csCmplList: c.csCmplList,
      }));

      await storage.update('data', STORAGE_KEY.COURSES, coursesData);
      logger.info(`Saved ${courses.length} courses to storage`);
    } catch (error) {
      logger.error('Failed to save courses', error);
      throw error;
    }
  }

  /**
   * 스토리지에서 과정 데이터 로드
   * @returns {Promise<Course[]>}
   */
  static async loadCourses() {
    try {
      logger.info('Loading courses from storage...');
      const coursesData = await storage.get('data', STORAGE_KEY.COURSES);

      if (!coursesData) {
        logger.info('No courses found in storage');
        return null;
      }

      const courses = coursesData.map(data => new Course(data));
      logger.info(`Loaded ${courses.length} courses from storage`);
      return courses;
    } catch (error) {
      logger.error('Failed to load courses', error);
      throw error;
    }
  }

  /**
   * 과정 데이터 업데이트
   * @param {number | null} year - 업데이트할 연도
   * @returns {Promise<Course[]>}
   */
  static async updateCourses(year = null) {
    try {
      logger.info(`Updating courses for year: ${year || 'All'}`);
      const courses = await this.fetchAllCourses(year);
      await this.saveCourses(courses);
      logger.info('Courses updated successfully');
      return courses;
    } catch (error) {
      logger.error('Failed to update courses', error);
      throw error;
    }
  }

  /**
   * 과정 검색
   * @param {Object} filters - 검색 필터
   * @returns {Promise<Course[]>}
   */
  static async searchCourses(filters = {}) {
    try {
      let courses = await this.loadCourses();

      if (!courses) {
        courses = await this.updateCourses(filters.year);
      }

      let results = courses;

      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase();
        results = results.filter(course =>
          course.csTitle.toLowerCase().includes(keyword)
        );
      }

      if (filters.year) {
        results = results.filter(course => course.csYear == filters.year);
      }

      if (filters.status) {
        results = results.filter(course => course.csStatusCd === filters.status);
      }

      if (filters.type) {
        results = results.filter(course => course.csCourseTypeCd === filters.type);
      }

      if (filters.customizedOnly) {
        results = results.filter(course => course.isCustomized());
      }

      logger.info(`Found ${results.length} courses matching filters`);
      return results;
    } catch (error) {
      logger.error('Failed to search courses', error);
      throw error;
    }
  }
}
