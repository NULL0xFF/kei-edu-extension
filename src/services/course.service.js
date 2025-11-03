/**
 * Course service - business logic
 */

import {CourseApi} from '../api/course.api.js';
import {storage} from '../core/storage.js';
import {COURSE, STORAGE_KEY} from '../config/constants.js';
import {logger} from '../core/error-handler.js';
import {ProgressTracker} from '../utils/progress.js';
import {formatCompletionDate} from '../utils/date.js';

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
    this.csCmplList = (data.csCmplList || []).map(completion => ({
      ...completion,
      cxCompletionDate: formatCompletionDate(completion.cxCompletionDate)
    }));
  }

  isCustomized() {
    return this.csTitlePath === '맞춤형';
  }

  getCompletionByMember(memberSeq) {
    return this.csCmplList.find(c => c.csMemberSeq === memberSeq) || null;
  }
}

export class CourseService {
  static async fetchAllCourses(filterYear = null) {
    try {
      logger.info('과정 목록 조회 중...');

      const totalCount = await CourseApi.getTotalCount();
      logger.info(`서버의 총 과정 수: ${totalCount}`);

      if (totalCount === 0) {
        return [];
      }

      let coursesData = await CourseApi.getAllCourses(totalCount);

      if (filterYear) {
        const originalCount = coursesData.length;
        coursesData = coursesData.filter(course => course.csYear == filterYear);
        logger.info(
            `${filterYear}년 과정 필터링: ${originalCount}개 중 ${coursesData.length}개`);
      }

      const progress = new ProgressTracker(
          coursesData.length,
          `${filterYear || '전체'}년 과정 상세 정보`
      );

      const courses = [];
      for (let i = 0; i < coursesData.length; i++) {
        const courseData = coursesData[i];

        try {
          // Fetch completion time (class count + exam count)
          const [classCount, examCount] = await Promise.all([
            CourseApi.getElementCount(
                courseData.csCourseActiveSeq,
                COURSE.ELEMENT_TYPE.ORGANIZATION
            ),
            CourseApi.getElementCount(
                courseData.csCourseActiveSeq,
                COURSE.ELEMENT_TYPE.EXAM
            )
          ]);
          courseData.csCmplTime = classCount + examCount;

          // Fetch completion information
          const completionCount = await CourseApi.getCompletionCount(
              courseData.csCourseActiveSeq
          );

          if (completionCount > 0) {
            const [completions, applications] = await Promise.all([
              CourseApi.getCompletions(
                  courseData.csCourseActiveSeq,
                  completionCount
              ),
              CourseApi.getApplications(
                  courseData.csCourseActiveSeq,
                  courseData.csCourseMasterSeq,
                  completionCount
              )
            ]);

            // Map study start dates
            const startDateMap = new Map();
            applications.forEach(app => {
              startDateMap.set(app.csMemberSeq, app.csStudyStartDate);
            });

            completions.forEach(comp => {
              comp.csStudyStartDate = startDateMap.get(comp.csMemberSeq) || '';
            });

            courseData.csCmplList = completions;
          } else {
            courseData.csCmplList = [];
          }

          courses.push(new Course(courseData));
        } catch (error) {
          logger.error(
              `Failed to fetch details for course ${courseData.csTitle}`,
              error);
          courses.push(new Course(courseData));
        }

        progress.update(i + 1);
      }

      progress.complete();
      return courses;
    } catch (error) {
      logger.error('Failed to fetch courses', error);
      throw error;
    }
  }

  static async saveCourses(courses) {
    try {
      logger.info('스토리지에 과정 저장 중...');
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
        csCmplList: c.csCmplList
      }));

      await storage.update('data', STORAGE_KEY.COURSES, coursesData);
      logger.info(`${courses.length}개 과정 저장 완료`);
    } catch (error) {
      logger.error('Failed to save courses', error);
      throw error;
    }
  }

  static async loadCourses() {
    try {
      logger.info('스토리지에서 과정 로드 중...');
      const coursesData = await storage.get('data', STORAGE_KEY.COURSES);

      if (!coursesData) {
        logger.info('스토리지에 과정 없음');
        return null;
      }

      const courses = coursesData.map(data => new Course(data));
      logger.info(`${courses.length}개 과정 로드 완료`);
      return courses;
    } catch (error) {
      logger.error('Failed to load courses', error);
      throw error;
    }
  }

  static async updateCourses(year = null) {
    try {
      logger.info(`과정 업데이트 시작: ${year || '전체'}년`);
      const courses = await this.fetchAllCourses(year);
      await this.saveCourses(courses);
      logger.info('과정 업데이트 성공');
      return courses;
    } catch (error) {
      logger.error('Failed to update courses', error);
      throw error;
    }
  }

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
        results = results.filter(course => course.csYear >= filters.year);
      }

      if (filters.customizedOnly) {
        results = results.filter(course => course.isCustomized());
      }

      logger.info(`Found ${results.length} courses`);
      return results;
    } catch (error) {
      logger.error('Failed to search courses', error);
      throw error;
    }
  }
}
