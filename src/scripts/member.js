import * as jQuery from 'jquery';
import { getCSRFToken, createLogger } from './shared.js';
import { addData, getData, isExist, updateData } from "./storage";

// Create logger for member component
const logger = createLogger('MEMBER');

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
  constructor(csMemberSeq, csMemberId, csMemberName, cxMemberBirthday,
    cxMemberEmail, cxCompanyName, cxDepartmentName, cxDivisionCdName,
    csCertiType) {
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

/**
 * Fetches the total number of active members from the server.
 * @function getActiveMemberCount
 * @returns {Promise} - The promise object representing the total number of active members.
 * @throws {Error} - The error thrown when failed to fetch total active members from server.
 */
function getActiveMemberCount() {
  logger.debug('Fetching total count of active members from server');

  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true // Include cookies in the request
      },
      url: "/user/member/selectMemberList.do",
      type: "post",
      data: new MemberRequest(),
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        logger.info(`Successfully fetched active member count: ${data.cnt}`);
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}): ${error}`);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          logger.debug('Retrying request to fetch active member count');
          jQuery.ajax(this);
        } else {
          logger.error('Failed to fetch total active members from server after all retry attempts', {
            xhr: xhr,
            status: status,
            error: error
          });
          reject(new Error(`Failed to fetch total active members: ${error}`));
        }
      }
    });
  });
}

/**
 * Fetches the active members from the server.
 * @function getActiveMembers
 * @param {number} count - The number of active members to fetch.
 * @returns {Promise} - The promise object representing the active members.
 */
function getActiveMembers(count = 10) {
  logger.debug(`Fetching ${count} active members from server`);

  return new Promise((resolve, reject) => {
    jQuery.ajax({
      headers: {
        'X-CSRF-TOKEN': getCSRFToken()
      },
      xhrFields: {
        withCredentials: true // Include cookies in the request
      },
      url: "/user/member/selectMemberList.do",
      type: "post",
      data: new MemberRequest(count),
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        logger.debug(`Processing ${data.list.length} member records`);
        const members = [];
        for (const item of data.list) {
          members.push(
            new Member(item.csMemberSeq, item.csMemberId, item.csMemberName,
              item.cxMemberBirthday, item.cxMemberEmail, item.cxCompanyName,
              item.cxDepartmentName, item.cxDivisionCdName,
              item.csCertiType));
        }
        logger.info(`Successfully fetched ${members.length} active members`);
        resolve(members);
      },
      error: function (xhr, status, error) {
        logger.warn(`Request failed (attempt ${this.tryCount + 1}/${this.retryLimit + 1}): ${error}`);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          logger.debug('Retrying request to fetch active members');
          jQuery.ajax(this);
        } else {
          logger.error('Failed to fetch active members from server after all retry attempts', {
            xhr: xhr,
            status: status,
            error: error
          });
          reject(new Error(`Failed to fetch active members: ${error}`));
        }
      }
    });
  });
}

/**
 * Fetch the active members in the database.
 * @function fetchMembers
 * @param {string} action - The action to perform ('add' or 'update').
 * @returns {Promise} - The promise object representing the processed active members.
 */
async function fetchMembers(action) {
  logger.info(`Starting fetch members operation: ${action}`);

  try {
    logger.debug('Fetching count of active members...');
    const activeMemberCount = await getActiveMemberCount();
    logger.info(`Found ${activeMemberCount} active members`);

    logger.debug('Fetching active members...');
    const members = await getActiveMembers(activeMemberCount);
    logger.info(`Successfully fetched ${members.length} active members`);

    if (action === 'add') {
      logger.info('Adding active members to the database...');
      await addData('members', members);
      logger.info(`Successfully added ${members.length} members to the database`);
    } else if (action === 'update') {
      logger.info('Updating active members in the database...');
      await updateData('members', members);
      logger.info(`Successfully updated ${members.length} members in the database`);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return members;
  } catch (error) {
    logger.error(`Failed to fetch members with action: ${action}`, error);
    throw error;
  }
}

/**
 * Adds the active members to the database.
 * @function addMembers
 * @returns {Promise} - The promise object representing the added active members.
 */
async function addMembers() {
  logger.info('Initiating add members operation');
  return await fetchMembers('add');
}

/**
 * Updates the active members in the database.
 * @function updateMembers
 * @returns {Promise} - The promise object representing the updated active members.
 */
async function updateMembers() {
  logger.info('Initiating update members operation');
  return await fetchMembers('update');
}

/**
 * Checks if the member belongs to the company.
 * @function isBelongedToCompany
 * @param {Member} member - The member to check.
 * @param {string} keyword - The keyword to search.
 * @returns {boolean} - The result indicating if the member belongs to the company.
 */
function isBelongedToCompany(member, keyword) {
  const companyMatch = member.cxCompanyName && member.cxCompanyName.includes(keyword);
  const departmentMatch = member.cxDepartmentName && member.cxDepartmentName.includes(keyword);
  const result = companyMatch || departmentMatch;

  logger.debug(`Member ${member.csMemberId} company/department match for "${keyword}": ${result}`);
  return result;
}

export async function searchMembers(input = '') {
  logger.info(`Searching members with input: "${input}"`);

  try {
    // Get all members from the database if exists
    const exist = await isExist('members');
    if (!exist) {
      logger.info('Members not found in database, fetching from server');
      await addMembers();
    } else {
      logger.debug('Members found in database, using cached data');
    }

    const members = await getData('members');
    logger.debug(`Retrieved ${members.length} members from database`);

    // Split the search keywords
    const keywords = input.split(' ');
    logger.debug(`Search keywords: ${keywords.join(', ')}`);

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

    logger.info(`Search completed, found ${results.length} matching members`);
    return results;
  } catch (error) {
    logger.error('Failed to search members', error);
    throw error;
  }
}

export { updateMembers };