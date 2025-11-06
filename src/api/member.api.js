/**
 * Member API endpoints
 */

import {apiClient} from '../core/api-client.js';
import {API_ENDPOINT, MEMBER, MENU_ID} from '../config/constants.js';
import {logger} from '../core/error-handler.js';

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
      searchCsTitle: ''
    };
    return this;
  }

  pageSize(count) {
    this.request.searchListCnt = count;
    return this;
  }

  status(status) {
    this.request.searchCsStatusCd = status;
    return this;
  }

  build() {
    return {...this.request};
  }
}

export class MemberApi {
  static async getMemberList(params) {
    logger.debug('Fetching member list', params);
    const response = await apiClient.post(API_ENDPOINT.MEMBER.LIST, params);
    return {cnt: response.cnt, list: response.list};
  }

  static async getApprovedMemberCount() {
    const request = new MemberRequestBuilder()
    .status(MEMBER.STATUS.APPROVAL)
    .pageSize(1)
    .build();
    const response = await this.getMemberList(request);
    return response.cnt || 0;
  }

  static async getAllApprovedMembers(count) {
    const request = new MemberRequestBuilder()
    .status(MEMBER.STATUS.APPROVAL)
    .pageSize(count)
    .build();
    const response = await this.getMemberList(request);
    return response.list || [];
  }
}
