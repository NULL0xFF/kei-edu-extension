import * as jQuery from 'jquery';

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
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: "/user/member/selectMemberList.do",
      type: "post",
      data: new MemberRequest(),
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        console.log(xhr);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          jQuery.ajax(this);
        } else {
          console.error("failed to fetch total active members from server!");
          reject(xhr, status, error);
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
  return new Promise((resolve, reject) => {
    jQuery.ajax({
      url: "/user/member/selectMemberList.do",
      type: "post",
      data: new MemberRequest(count),
      dataType: "json",
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        const members = [];
        for (const item of data.list) {
          members.push(
              new Member(item.csMemberSeq, item.csMemberId, item.csMemberName,
                  item.cxMemberBirthday, item.cxMemberEmail, item.cxCompanyName,
                  item.cxDepartmentName, item.cxDivisionCdName,
                  item.csCertiType));
        }
        resolve(members);
      },
      error: function (xhr, status, error) {
        console.log(xhr);
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          jQuery.ajax(this);

        } else {
          console.error("failed to fetch active members from server!");
          reject(xhr, status, error);
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
  console.debug('Fetching count of active members...');
  const activeMemberCount = await getActiveMemberCount();
  console.debug(`Found ${activeMemberCount} active members.`);

  console.debug('Fetching active members...');
  const members = await getActiveMembers(activeMemberCount);
  console.debug(`Found ${members.length} active members.`);

  if (action === 'add') {
    console.debug('Adding active members to the database...');
    await addData('members', members);
    console.debug(
        `Successfully added ${members.length} members to the database.`);
  } else if (action === 'update') {
    console.log('Updating active members in the database...');
    await updateData('members', members);
    console.log(
        `Successfully updated ${members.length} members in the database.`);
  } else {
    throw new Error(`Unknown action: ${action}`);
  }

  return members;
}

/**
 * Adds the active members to the database.
 * @function addMembers
 * @returns {Promise} - The promise object representing the added active members.
 */
async function addMembers() {
  return await fetchMembers('add');
}

/**
 * Updates the active members in the database.
 * @function updateMembers
 * @returns {Promise} - The promise object representing the updated active members.
 */
async function updateMembers() {
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
  return (member.cxCompanyName && member.cxCompanyName.includes(keyword))
      || (member.cxDepartmentName && member.cxDepartmentName.includes(keyword));
}

async function searchMembers(input = '') {
  // Get all members from the database if exists
  var exist = await isExist('members');
  if (!exist) {
    await addMembers();
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