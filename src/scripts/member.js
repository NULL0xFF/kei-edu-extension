// src/scripts/member.js
import $ from 'jquery';
import {addData, updateData} from './storage';

// Class definitions
class Member {
  constructor(
      csMemberSeq,
      csMemberId,
      csMemberName,
      cxMemberBirthday,
      cxMemberEmail,
      cxCompanyName,
      cxDepartmentName,
      cxDivisionCdName,
      csCertiType
  ) {
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

class MemberRequest {
  static Order = {
    NAME_ASC: 1,
    NAME_DESC: -1,
    ID_ASC: 2,
    ID_DESC: -2,
    DATE_ASC: 3,
    DATE_DESC: -3,
  };
  static Status = {
    ALL: '',
    APPROVAL: 'approval',
    WAIT: 'wait',
    LEAVE: 'leave',
    RELEAVE: 'releave',
  };
  static SearchCategory = {
    ALL: '',
    NAME: 'memberName',
    ID: 'memberId',
    BIRTHDAY: 'memberBirthday',
    EMAIL: 'memberEmail',
    COMPANY: 'cxCompanyName',
  };

  constructor(count = 10, search = '') {
    this.pageIndex = 1;
    this.searchListCnt = count;
    this.orderBy = this.constructor.Order.DATE_DESC;
    this.dspLinkMenuId = 'MG0086';
    this.dspMenuId = 'MG0086';
    this.searchCsStatusCd = this.constructor.Status.APPROVAL;
    this.searchMemberDivision = '';
    this.searchMemberGubun = this.constructor.SearchCategory.ALL;
    this.searchCsTitle = search;
  }
}

// AJAX functions
export function getActiveMemberCount() {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/user/member/selectMemberList.do',
      type: 'post',
      data: new MemberRequest(),
      dataType: 'json',
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        resolve(data.cnt);
      },
      error: function (xhr, status, error) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          $.ajax(this);
          return;
        } else {
          reject(error);
        }
      },
    });
  });
}

export function getActiveMembers(count = 10) {
  return new Promise((resolve, reject) => {
    $.ajax({
      url: '/user/member/selectMemberList.do',
      type: 'post',
      data: new MemberRequest(count),
      dataType: 'json',
      tryCount: 0,
      retryLimit: 3,
      success: function (data) {
        const members = data.list.map(
            (item) =>
                new Member(
                    item.csMemberSeq,
                    item.csMemberId,
                    item.csMemberName,
                    item.cxMemberBirthday,
                    item.cxMemberEmail,
                    item.cxCompanyName,
                    item.cxDepartmentName,
                    item.cxDivisionCdName,
                    item.csCertiType
                )
        );
        resolve(members);
      },
      error: function (xhr, status, error) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
          $.ajax(this);
          return;
        } else {
          reject(error);
        }
      },
    });
  });
}

// Function to fetch members and add/update them in the database
async function fetchMembers(action) {
  console.log('Fetching count of active members...');
  const activeMemberCount = await getActiveMemberCount();
  console.log(`Found ${activeMemberCount} active members.`);

  console.log('Fetching active members...');
  const members = await getActiveMembers(activeMemberCount);
  console.log(`Fetched ${members.length} active members.`);

  if (action === 'add') {
    console.log('Adding active members to the database...');
    await addData('members', members);
    console.log(
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

// Function to add members
export async function addMembers() {
  return await fetchMembers('add');
}

// Function to update members
export async function updateMembers() {
  return await fetchMembers('update');
}

// Export classes and functions
export {Member, MemberRequest};
