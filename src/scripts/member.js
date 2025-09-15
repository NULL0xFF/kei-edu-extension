import Logger from './logger.js';
import {getData, isExist} from './storage.js';
import {ajaxJSON, getCSRFToken} from './utility.js';

const logger = new Logger('member');

/**
 * Represents a member.
 * @class
 * @constructor
 * @param {number} csMemberSeq - The member sequence number.
 * @param {string} csMemberId - The member ID.
 * @param {string} csMemberName - The member name.
 * @param {string} cxMemberBirthday - The member birthday.
 * @param {string} cxMemberEmail - The member email.
 * @param {string} cxCompanyName - The company name.
 * @param {string} cxDepartmentName - The department name.
 * @param {string} cxDivisionCdName - The division code name.
 * @param {string} csCertiType - The certification type.
 * @returns {Member} - The member object.
 */
class Member {
  constructor(csMemberSeq, csMemberId, csMemberName, cxMemberBirthday, cxMemberEmail, cxCompanyName, cxDepartmentName, cxDivisionCdName, csCertiType) {
    this.csMemberSeq = csMemberSeq;
    this.csMemberId = csMemberId;
    this.csMemberName = csMemberName;
    this.cxMemberBirthday = cxMemberBirthday;
    this.cxMemberEmail = cxMemberEmail;
    this.cxCompanyName = cxCompanyName;
    this.cxDepartmentName = cxDepartmentName;
    this.cxDivisionCdName = cxDivisionCdName;
    this.csCertiType = csCertiType;
  }
}

/**
 * Represents a member request.
 * @class
 * @constructor
 * @param {string} search - The search criteria.
 * @param {number} count - The number of search results to return.
 * @returns {MemberRequest} - The member request object.
 */
class MemberRequest {
  static Order = {
    NAME_ASC: 1, // Name Ascending (이름 오름차순)
    NAME_DESC: -1, // Name Descending (이름 내림차순)
    ID_ASC: 2, // Username Ascending (아이디 오름차순)
    ID_DESC: -2, // Username Descending (아이디 내림차순)
    DATE_ASC: 3, // Registration Date Ascending (회원가입일 오름차순)
    DATE_DESC: -3 // Registration Date Descending (회원가입일 내림차순)
  }
  static Status = {
    ALL: '', // All (전체)
    APPROVAL: 'approval', // Approval (승인)
    WAIT: 'wait', // Waiting (대기)
    LEAVE: 'leave', // Leave (탈퇴)
    RELEAVE: 'releave' // Leave Requested (탈퇴요청)
  }
  static SearchCategory = {
    ALL: '', // All (전체)
    NAME: 'memberName', // Name (이름)
    ID: 'memberId', // Username (아이디)
    BIRTHDAY: 'memberBirthday', // Birthday (생년월일)
    EMAIL: 'memberEmail', // Email (이메일)
    COMPANY: 'cxCompanyName' // Company (소속기관)
  }

  constructor(count = 10, search = '') {
    this.pageIndex = 1;
    this.searchListCnt = count;
    this.orderBy = this.constructor.Order.DATE_DESC;
    this.dspLinkMenuId = 'MG0086';
    this.dspMenuId = 'MG0086';
    this.searchCsStatusCd = this.constructor.Status.APPROVAL; // Approval (승인)
    this.searchMemberDivision = ''; // Member Type (회원유형)
    this.searchMemberGubun = this.constructor.SearchCategory.ALL;
    this.searchCsTitle = search;
  }
}

async function getActiveMemberCount({signal}) {
  const csrf = getCSRFToken();
  const payload = new MemberRequest();

  const response = await ajaxJSON({
    url: '/user/member/selectMemberList.do', method: 'POST', headers: {
      'X-CSRF-TOKEN': csrf
    }, contentType: 'application/x-www-form-urlencoded; charset=UTF-8', data: jQuery.param(payload, true)
  }, {
    signal, timeout: 500, retries: 6, retryInitialDelayMs: 1000, retryFactor: 2, retryCapMs: 16000, totalBudgetMs: 60000
  });

  const count = Number(response?.cnt);

  if (!Number.isFinite(count)) {
    logger.error(`Invalid response: expected numeric "cnt", got ${JSON.stringify(response)}`, 'getActiveMemberCount');
    throw new Error('Invalid response');
  }

  return count;
}

async function getActiveMembers({signal}, count = 10) {
  const csrf = getCSRFToken();
  const payload = new MemberRequest(count);

  const response = await ajaxJSON({
    url: '/user/member/selectMemberList.do', method: 'POST', headers: {
      'X-CSRF-TOKEN': csrf
    }, contentType: 'application/x-www-form-urlencoded; charset=UTF-8', data: jQuery.param(payload, true)
  }, {signal, timeout: 20000, retries: 3});

  const members = response?.list.map(member => new Member(member.csMemberSeq, member.csMemberId, member.csMemberName, member.cxMemberBirthday, member.cxMemberEmail, member.cxCompanyName, member.cxDepartmentName, member.cxDivisionCdName, member.csCertiType));

  return members;
}

/**
 * Checks if the member belongs to the company.
 * @function isBelongedToCompany
 * @param {Member} member - The member to check.
 * @param {string} keyword - The keyword to search.
 * @returns {boolean} - The result indicating if the member belongs to the company.
 */
function isBelongedToCompany(member, keyword) {
  return (member.cxCompanyName && member.cxCompanyName.includes(keyword)) || (member.cxDepartmentName && member.cxDepartmentName.includes(keyword));
}

async function loadMembers(input = '') {
  // Get all members from the database if exists
  const exist = await isExist('members');
  if (!exist) {
    logger.error('No member data found in the database. Please fetch and store member data first.', 'loadMembers');
    throw new Error('No member data found in the database.');
  }
  const members = await getData('members');

  // Split the search keywords
  const keywords = input.split(' ');

  // Search for members that match the search criteria
  const results = [];
  for (const member of members) {
    for (const keyword of keywords) {
      // Search for member's attributes that match the keyword
      if (isBelongedToCompany(member, keyword)) {
        results.push(member);
        break;
      }
    }
  }

  // Return the search results
  return results;
}

export {
  Member, MemberRequest, getActiveMemberCount, getActiveMembers, loadMembers
}