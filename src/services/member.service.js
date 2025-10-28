/**
 * @file member.service.js
 * @description 회원 비즈니스 로직
 */

import { MemberApi } from '../api/member.api.js';
import { storage } from '../core/storage.js';
import { STORAGE_KEY } from '../config/constants.js';
import { logger } from '../core/error-handler.js';

/**
 * 회원 모델
 */
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

  /**
   * 특정 회사/부서에 속하는지 확인
   * @param {string} keyword - 검색 키워드
   * @returns {boolean}
   */
  belongsToOrganization(keyword) {
    const lowerKeyword = keyword.toLowerCase();
    return (
      (this.cxCompanyName && this.cxCompanyName.toLowerCase().includes(lowerKeyword)) ||
      (this.cxDepartmentName && this.cxDepartmentName.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * 이름으로 검색
   * @param {string} keyword - 검색 키워드
   * @returns {boolean}
   */
  matchesName(keyword) {
    return this.csMemberName.toLowerCase().includes(keyword.toLowerCase());
  }

  /**
   * 이메일로 검색
   * @param {string} keyword - 검색 키워드
   * @returns {boolean}
   */
  matchesEmail(keyword) {
    return this.cxMemberEmail && 
           this.cxMemberEmail.toLowerCase().includes(keyword.toLowerCase());
  }

  /**
   * 회원 정보 문자열 생성
   * @returns {string}
   */
  toString() {
    return `${this.csMemberName} (${this.csMemberId}) - ${this.cxCompanyName || 'N/A'}`;
  }
}

/**
 * 회원 서비스 클래스
 */
export class MemberService {
  /**
   * 모든 승인된 회원 데이터 가져오기
   * @returns {Promise<Member[]>}
   */
  static async fetchAllMembers() {
    try {
      logger.info('Fetching all approved members...');
      
      // 전체 회원 수 조회
      const totalCount = await MemberApi.getApprovedMemberCount();
      logger.info(`Total approved members: ${totalCount}`);
      
      if (totalCount === 0) {
        return [];
      }
      
      // 모든 회원 조회
      const membersData = await MemberApi.getAllApprovedMembers(totalCount);
      logger.info(`Fetched ${membersData.length} members`);
      
      const members = membersData.map(data => new Member(data));
      return members;
    } catch (error) {
      logger.error('Failed to fetch members', error);
      throw error;
    }
  }

  /**
   * 회원 데이터를 스토리지에 저장
   * @param {Member[]} members - 회원 목록
   * @returns {Promise<void>}
   */
  static async saveMembers(members) {
    try {
      logger.info('Saving members to storage...');
      const membersData = members.map(m => ({
        csMemberSeq: m.csMemberSeq,
        csMemberId: m.csMemberId,
        csMemberName: m.csMemberName,
        cxMemberBirthday: m.cxMemberBirthday,
        cxMemberEmail: m.cxMemberEmail,
        cxCompanyName: m.cxCompanyName,
        cxDepartmentName: m.cxDepartmentName,
        cxDivisionCdName: m.cxDivisionCdName,
        csCertiType: m.csCertiType,
      }));
      
      await storage.update('data', STORAGE_KEY.MEMBERS, membersData);
      logger.info(`Saved ${members.length} members to storage`);
    } catch (error) {
      logger.error('Failed to save members', error);
      throw error;
    }
  }

  /**
   * 스토리지에서 회원 데이터 로드
   * @returns {Promise<Member[]>}
   */
  static async loadMembers() {
    try {
      logger.info('Loading members from storage...');
      const membersData = await storage.get('data', STORAGE_KEY.MEMBERS);
      
      if (!membersData) {
        logger.info('No members found in storage');
        return null;
      }
      
      const members = membersData.map(data => new Member(data));
      logger.info(`Loaded ${members.length} members from storage`);
      return members;
    } catch (error) {
      logger.error('Failed to load members', error);
      throw error;
    }
  }

  /**
   * 회원 데이터 업데이트
   * @returns {Promise<Member[]>}
   */
  static async updateMembers() {
    try {
      logger.info('Updating members...');
      const members = await this.fetchAllMembers();
      await this.saveMembers(members);
      logger.info('Members updated successfully');
      return members;
    } catch (error) {
      logger.error('Failed to update members', error);
      throw error;
    }
  }

  /**
   * 회원 검색
   * @param {Object} filters - 검색 필터
   * @returns {Promise<Member[]>}
   */
  static async searchMembers(filters = {}) {
    try {
      let members = await this.loadMembers();
      
      // 스토리지에 데이터가 없으면 가져오기
      if (!members) {
        members = await this.updateMembers();
      }
      
      // 필터 적용
      let results = members;
      
      if (filters.keyword) {
        const keyword = filters.keyword;
        results = results.filter(member =>
          member.belongsToOrganization(keyword) ||
          member.matchesName(keyword) ||
          member.matchesEmail(keyword)
        );
      }
      
      if (filters.company) {
        results = results.filter(member =>
          member.cxCompanyName && 
          member.cxCompanyName.toLowerCase().includes(filters.company.toLowerCase())
        );
      }
      
      if (filters.department) {
        results = results.filter(member =>
          member.cxDepartmentName && 
          member.cxDepartmentName.toLowerCase().includes(filters.department.toLowerCase())
        );
      }
      
      logger.info(`Found ${results.length} members matching filters`);
      return results;
    } catch (error) {
      logger.error('Failed to search members', error);
      throw error;
    }
  }

  /**
   * 회원 ID로 조회
   * @param {string} memberId - 회원 ID
   * @returns {Promise<Member|null>}
   */
  static async getMemberById(memberId) {
    try {
      const members = await this.loadMembers();
      if (!members) {
        return null;
      }
      
      return members.find(m => m.csMemberId === memberId) || null;
    } catch (error) {
      logger.error(`Failed to get member by ID: ${memberId}`, error);
      throw error;
    }
  }

  /**
   * 회원 시퀀스로 조회
   * @param {number} memberSeq - 회원 시퀀스
   * @returns {Promise<Member|null>}
   */
  static async getMemberBySeq(memberSeq) {
    try {
      const members = await this.loadMembers();
      if (!members) {
        return null;
      }
      
      return members.find(m => m.csMemberSeq === memberSeq) || null;
    } catch (error) {
      logger.error(`Failed to get member by Seq: ${memberSeq}`, error);
      throw error;
    }
  }
}
