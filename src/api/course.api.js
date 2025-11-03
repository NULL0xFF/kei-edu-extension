/**
 * Course API endpoints
 */

import {apiClient} from '../core/api-client.js';
import {API_ENDPOINT, COURSE, MENU_ID} from '../config/constants.js';
import {logger} from '../core/error-handler.js';

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
      searchCsTitle: ''
    };
    return this;
  }

  pageSize(count) {
    this.request.searchListCnt = count;
    return this;
  }

  year(year) {
    this.request.searchCsYear = year;
    return this;
  }

  build() {
    return {...this.request};
  }
}

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
      searchCsMemberId: ''
    };
  }

  pageSize(count) {
    this.request.searchListCnt = count;
    return this;
  }

  build() {
    return {...this.request};
  }
}

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
      searchCsMemberName: ''
    };
  }

  pageSize(count) {
    this.request.searchListCnt = count;
    return this;
  }

  build() {
    return {...this.request};
  }
}

export class CourseApi {
  static async getCourseList(params) {
    logger.debug('Fetching course list', params);
    const response = await apiClient.post(API_ENDPOINT.COURSE.LIST, params);
    return {cnt: response.cnt, list: response.list};
  }

  static async getTotalCount() {
    const request = new CourseRequestBuilder().pageSize(1).build();
    const response = await this.getCourseList(request);
    return response.cnt || 0;
  }

  static async getAllCourses(count) {
    const request = new CourseRequestBuilder().pageSize(count).build();
    const response = await this.getCourseList(request);
    return response.list || [];
  }

  static async getElementCount(courseActiveSeq, elementType) {
    const params = {
      csCourseActiveSeq: courseActiveSeq,
      csReferenceTypeCd: elementType,
      dspMenuId: MENU_ID.COURSE_ELEMENT,
      dspLinkMenuId: MENU_ID.COURSE_ELEMENT
    };
    const response = await apiClient.post(API_ENDPOINT.COURSE.ELEMENT_LIST,
        params);
    return response.list?.length || 0;
  }

  static async getCompletionCount(courseActiveSeq) {
    const request = new CompletionRequestBuilder(courseActiveSeq).pageSize(
        1).build();
    const response = await apiClient.post(API_ENDPOINT.COMPLETION.LIST,
        request);
    return response.cnt || 0;
  }

  static async getCompletions(courseActiveSeq, count) {
    const request = new CompletionRequestBuilder(courseActiveSeq).pageSize(
        count).build();
    const response = await apiClient.post(API_ENDPOINT.COMPLETION.LIST,
        request);
    return response.list || [];
  }

  static async getApplications(courseActiveSeq, courseMasterSeq, count) {
    const request = new ApplicationRequestBuilder(courseActiveSeq,
        courseMasterSeq)
    .pageSize(count)
    .build();
    const response = await apiClient.post(API_ENDPOINT.APPLICATION.LIST,
        request);
    return response.list || [];
  }
}
