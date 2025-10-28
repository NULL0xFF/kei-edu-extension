/**
 * @file member.api.js
 * @description 회원 관련 API 호출
 */

import { apiClient } from '../core/api-client.js';
import { API_ENDPOINT, MEMBER, MENU_ID } from '../config/constants.js';
import { logger } from '../core/error-handler.js';

/**
 * 회원 요청 빌더
 */
export class MemberRequestBuilder {
  constructor() {
    this.reset();
  }

  reset() {
    this.request = {
      pageIndex: 1,
      searchListCnt: 10,
      orderBy: MEMBER.SORT.DATE_DESC,
      dspLinkMenuId: MENU_ID.MEMBER,
      dspMenuId: MENU_ID.MEMBER,
      searchCsStatusCd: MEMBER.STATUS.APPROVAL,
      searchMemberDivision: '',
      searchMemberGubun: MEMBER.SEARCH_CATEGORY.ALL,
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

  status(status) {
    this.request.searchCsStatusCd = status;
    return this;
  }

  searchCategory(category) {
    this.request.searchMemberGubun = category;
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
 * 회원 API 클래스
 */
export class MemberApi {
  /**
   * 회원 목록 조회
   * @param {Object} params - 요청 파라미터
   * @returns {Promise<Object>}
   */
  static async getMemberList(params) {
    logger.debug('Fetching member list', params);
    const response = await apiClient.post(API_ENDPOINT.MEMBER.LIST, params);
    return response;
  }

  /**
   * 승인된 회원 수 조회
   * @returns {Promise<number>}
   */
  static async getApprovedMemberCount() {
    const request = new MemberRequestBuilder()
      .status(MEMBER.STATUS.APPROVAL)
      .pageSize(1)
      .build();
    
    const response = await this.getMemberList(request);
    return response.cnt || 0;
  }

  /**
   * 모든 승인된 회원 조회
   * @param {number} count - 회원 수
   * @returns {Promise<Array>}
   */
  static async getAllApprovedMembers(count) {
    const request = new MemberRequestBuilder()
      .status(MEMBER.STATUS.APPROVAL)
      .pageSize(count)
      .build();
    
    const response = await this.getMemberList(request);
    return response.aaData || [];
  }

  /**
   * 검색어로 회원 조회
   * @param {string} keyword - 검색어
   * @param {number} maxResults - 최대 결과 수
   * @returns {Promise<Array>}
   */
  static async searchMembers(keyword, maxResults = 1000) {
    const request = new MemberRequestBuilder()
      .status(MEMBER.STATUS.APPROVAL)
      .search(keyword)
      .pageSize(maxResults)
      .build();
    
    const response = await this.getMemberList(request);
    return response.aaData || [];
  }
}
