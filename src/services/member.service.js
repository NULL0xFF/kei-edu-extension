/**
 * Member service - business logic
 */

import {MemberApi} from '../api/member.api.js';
import {storage} from '../core/storage.js';
import {STORAGE_KEY} from '../config/constants.js';
import {logger} from '../core/error-handler.js';

export class Member {
  constructor(data) {
    this.csMemberSeq = data.csMemberSeq;
    this.csMemberId = data.csMemberId;
    this.csMemberName = data.csMemberName;
    this.cxMemberBirthday = data.cxMemberBirthday;
    this.cxMemberEmail = data.cxMemberEmail;
    this.cxCompanyName = data.cxCompanyName;
    this.cxDepartmentName = data.cxDepartmentName;
    this.cxDivisionCdName = data.cxDivisionCdName;
    this.csCertiType = data.csCertiType;
  }

  belongsToOrganization(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return (
        (this.cxCompanyName && this.cxCompanyName.toLowerCase().includes(
            lowerKeyword)) ||
        (this.cxDepartmentName && this.cxDepartmentName.toLowerCase().includes(
            lowerKeyword))
    );
  }

  matchesKeyword(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return (
        this.csMemberName.toLowerCase().includes(lowerKeyword) ||
        this.csMemberId.toLowerCase().includes(lowerKeyword) ||
        (this.cxMemberEmail && this.cxMemberEmail.toLowerCase().includes(
            lowerKeyword)) ||
        this.belongsToOrganization(keyword)
    );
  }
}

export class MemberService {
  static async fetchAllMembers() {
    try {
      logger.info('승인된 회원 조회 중...');

      const totalCount = await MemberApi.getApprovedMemberCount();
      logger.info(`총 승인된 회원 수: ${totalCount}`);

      if (totalCount === 0) {
        return [];
      }

      const membersData = await MemberApi.getAllApprovedMembers(totalCount);
      logger.info(`${membersData.length}명 조회 완료`);

      const members = membersData.map(data => new Member(data));
      return members;
    } catch (error) {
      logger.error('Failed to fetch members', error);
      throw error;
    }
  }

  static async saveMembers(members) {
    try {
      logger.info('스토리지에 회원 저장 중...');
      const membersData = members.map(m => ({
        csMemberSeq: m.csMemberSeq,
        csMemberId: m.csMemberId,
        csMemberName: m.csMemberName,
        cxMemberBirthday: m.cxMemberBirthday,
        cxMemberEmail: m.cxMemberEmail,
        cxCompanyName: m.cxCompanyName,
        cxDepartmentName: m.cxDepartmentName,
        cxDivisionCdName: m.cxDivisionCdName,
        csCertiType: m.csCertiType
      }));

      await storage.update('data', STORAGE_KEY.MEMBERS, membersData);
      logger.info(`${members.length}명 저장 완료`);
    } catch (error) {
      logger.error('Failed to save members', error);
      throw error;
    }
  }

  static async loadMembers() {
    try {
      logger.info('스토리지에서 회원 로드 중...');
      const membersData = await storage.get('data', STORAGE_KEY.MEMBERS);

      if (!membersData) {
        logger.info('스토리지에 회원 없음');
        return null;
      }

      const members = membersData.map(data => new Member(data));
      logger.info(`${members.length}명 로드 완료`);
      return members;
    } catch (error) {
      logger.error('Failed to load members', error);
      throw error;
    }
  }

  static async updateMembers() {
    try {
      logger.info('회원 업데이트 시작...');
      const members = await this.fetchAllMembers();
      await this.saveMembers(members);
      logger.info('회원 업데이트 성공');
      return members;
    } catch (error) {
      logger.error('Failed to update members', error);
      throw error;
    }
  }

  static async searchMembers(filters = {}) {
    try {
      let members = await this.loadMembers();

      if (!members) {
        members = await this.updateMembers();
      }

      let results = members;

      if (filters.keyword) {
        results = results.filter(member =>
            member.matchesKeyword(filters.keyword)
        );
      }

      logger.info(`검색 결과: ${results.length}명`);
      return results;
    } catch (error) {
      logger.error('Failed to search members', error);
      throw error;
    }
  }
}
