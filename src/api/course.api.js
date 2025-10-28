/**
 * @file course.api.js
 * @description 과정 관련 API 호출
 */

import { apiClient } from '../core/api-client.js';
import { API_ENDPOINT, COURSE, MENU_ID } from '../config/constants.js';
import { logger } from '../core/error-handler.js';

/**
 * 과정 요청 빌더
 */
export class CourseRequestBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.request = {
      pageIndex: 1,
      searchListCnt: 10,
      orderBy: COURSE.SORT.DATE_DESC,
      dspLinkMenuId: MENU_ID.COURSE,
      dspMenuId: MENU_ID.COURSE,
      searchCsCategorySeq: COURSE.CATEGORY.ALL,
      searchCsSubjectCode: '',
      searchCsYear: '',
      searchCsCourseTypeCd: COURSE.TYPE.ALL,
      searchCsStatusCd: COURSE.STATUS.ALL,
      searchCsTitle: '',
    };
    return this;
  }

  pageSize(count) {
    this.request.searchListCnt = count;
    return this;
  }

  page(index) {
    this.request.pageIndex = index;
    return this;
  }

  orderBy(order) {
    this.request.orderBy = order;
    return this;
  }

  category(category) {
    this.request.searchCsCategorySeq = category;
    return this;
  }

  year(year) {
    this.request.searchCsYear = year;
    return this;
  }

  type(type) {
    this.request.searchCsCourseTypeCd = type;
    return this;
  }

  status(status) {
    this.request.searchCsStatusCd = status;
    return this;
  }

  search(keyword) {
    this.request.searchCsTitle = keyword;
    return this;
  }

  build() {
    return { ...this.request };
  }
}

/**
 * 수료 요청 빌더
 */
export class CompletionRequestBuilder {
  constructor(courseActiveSeq) {
    this.request = {
      pageIndex: 1,
      searchListCnt: 10,
      orderBy: 1,
      dspLinkMenuId: MENU_ID.COMPLETION,
      dspMenuId: MENU_ID.COMPLETION,
      searchCsCourseActiveSeq: courseActiveSeq,
      searchCsCompletionYn: '',
      searchCsMemberName: '',
      searchCsMemberId: '',
    };
  }

  pageSize(count) {
    this.request.searchListCnt = count;
    return this;
  }

  completion(status) {
    this.request.searchCsCompletionYn = status;
    return this;
  }

  build() {
    return { ...this.request };
  }
}

/**
 * 수강 신청 정보 요청 빌더
 */
export class ApplicationRequestBuilder {
  constructor(courseActiveSeq, courseMasterSeq) {
    this.request = {
      pageIndex: 1,
      searchListCnt: 10,
      dspLinkMenuId: MENU_ID.APPLICATION,
      dspMenuId: MENU_ID.APPLICATION,
      searchCsCourseActiveSeq: courseActiveSeq,
      searchCsCourseMasterSeq: courseMasterSeq,
      searchCsApplyStatusCd: '',
      searchCxDivisionCd: '',
      searchCsMemberId: '',
      searchCsMemberName: '',
    };
  }

  pageSize(count) {
    this.request.searchListCnt = count;
    return this;
  }

  build() {
    return { ...this.request };
  }
}


/**
 * 과정 API 클래스
 */
export class CourseApi {
  /**
   * 과정 목록 조회
   * @param {Object} params - 요청 파라미터
   * @returns {Promise<Object>}
   */
  static async getCourseList(params) {
    logger.debug('Fetching course list', params);
    const response = await apiClient.post(API_ENDPOINT.COURSE.LIST, params);
    return { cnt: response.cnt, aaData: response.list };
  }

  /**
   * 전체 과정 수 조회
   * @returns {Promise<number>}
   */
  static async getTotalCount() {
    const request = new CourseRequestBuilder()
      .pageSize(1)
      .build();

    const response = await this.getCourseList(request);
    return response.cnt || 0;
  }

  /**
   * 모든 과정 조회
   * @param {number} count - 과정 수
   * @returns {Promise<Array>}
   */
  static async getAllCourses(count) {
    const request = new CourseRequestBuilder()
      .pageSize(count)
      .build();

    const response = await this.getCourseList(request);
    return response.aaData || [];
  }

  /**
   * 과정 구성요소(차시, 시험) 수 조회 (수정)
   * @param {number} courseActiveSeq - 과정 활성 시퀀스
   * @param {string} elementType - 구성요소 타입 (organization, exam)
   * @returns {Promise<number>}
   */
  static async getElementCount(courseActiveSeq, elementType) {
    const params = {
      csCourseActiveSeq: courseActiveSeq,
      csReferenceTypeCd: elementType,
      dspMenuId: MENU_ID.COURSE_ELEMENT,
      dspLinkMenuId: MENU_ID.COURSE_ELEMENT,
    };

    const response = await apiClient.post(
      API_ENDPOINT.COURSE.ELEMENT_LIST,
      params
    );
    return response.list?.length || 0;
  }

  /**
   * 수료 정보 수 조회
   * @param {number} courseActiveSeq - 과정 활성 시퀀스
   * @returns {Promise<number>}
   */
  static async getCompletionCount(courseActiveSeq) {
    const request = new CompletionRequestBuilder(courseActiveSeq)
      .pageSize(1)
      .build();

    const response = await apiClient.post(
      API_ENDPOINT.COMPLETION.LIST,
      request
    );
    return response.cnt || 0;
  }

  /**
   * 수료 정보 조회
   * @param {number} courseActiveSeq - 과정 활성 시퀀스
   * @param {number} count - 수료 정보 수
   * @returns {Promise<Array>}
   */
  static async getCompletions(courseActiveSeq, count) {
    const request = new CompletionRequestBuilder(courseActiveSeq)
      .pageSize(count)
      .build();

    const response = await apiClient.post(
      API_ENDPOINT.COMPLETION.LIST,
      request
    );
    return response.list || [];
  }

  /**
   * 수강 신청 목록 조회 (추가)
   * @param {number} courseActiveSeq
   * @param {number} courseMasterSeq
   * @param {number} count
   * @returns {Promise<Array>}
   */
  static async getApplications(courseActiveSeq, courseMasterSeq, count) {
    const request = new ApplicationRequestBuilder(courseActiveSeq, courseMasterSeq)
      .pageSize(count)
      .build();

    const response = await apiClient.post(
      API_ENDPOINT.APPLICATION.LIST,
      request
    );
    return response.list || [];
  }
}
