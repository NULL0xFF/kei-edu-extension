/**
 * @file events.js
 * @description UI 이벤트 핸들러
 */

import { CourseService } from '../services/course.service.js';
import { MemberService } from '../services/member.service.js';
import { StatsService } from '../services/stats.service.js';
import { downloadCSV } from '../utils/file.js';
import { getFileTimestamp } from '../utils/date.js';
import { logger } from '../core/error-handler.js';
import {
  LoadingIndicator,
  PromptDialog,
  getSearchInput,
} from './components.js';

/**
 * 통계 버튼 클릭 핸들러
 * @param {Button} button - 버튼 객체
 * @returns {Function}
 */
export function createStatisticsClickHandler(button) {
  return async function () {
    try {
      // 검색 입력 받기
      const input = getSearchInput();
      if (!input) {
        return;
      }
      
      // 로딩 시작
      const loading = new LoadingIndicator(button);
      loading.start('통계 생성 중...');
      
      // 통계 생성
      const records = await StatsService.generateStats({
        keyword: input.keyword,
        startDate: input.startDate,
        endDate: input.endDate,
      });
      
      if (records.length === 0) {
        PromptDialog.alert('검색 결과가 없습니다.');
        loading.stop();
        return;
      }
      
      // CSV 데이터 변환
      const csvData = StatsService.convertToCSVData(records);
      
      // 파일 다운로드
      const filename = `통계_${input.keyword || '전체'}`;
      downloadCSV(filename, csvData);
      
      // 요약 정보 출력
      const summary = StatsService.getSummary(records);
      logger.info('Statistics Summary:', summary);
      
      // 로딩 종료
      loading.stop();
      
      PromptDialog.alert(
        `통계 생성 완료\n\n` +
        `대상 회원: ${summary.totalMembers}명\n` +
        `총 과정: ${summary.totalCourses}개\n` +
        `총 수료: ${summary.totalCompletions}건\n` +
        `평균 이수 시간: ${summary.averageCompletionTime}시간`
      );
    } catch (error) {
      logger.error('Failed to generate statistics', error);
      PromptDialog.alert(`통계 생성 실패: ${error.message}`);
      
      // 버튼 상태 복원
      if (button) {
        button.setText('통계').setEnabled(true);
      }
    }
  };
}

/**
 * 업데이트 버튼 클릭 핸들러
 * @param {Button} button - 버튼 객체
 * @returns {Function}
 */
export function createUpdateClickHandler(button) {
  return async function () {
    try {
      // 로딩 시작
      const loading = new LoadingIndicator(button);
      
      // 회원 업데이트
      loading.start('회원 업데이트 중...');
      const members = await MemberService.updateMembers();
      logger.info(`Updated ${members.length} members`);
      
      // 과정 업데이트
      loading.updateMessage('과정 업데이트 중...');
      const courses = await CourseService.updateCourses();
      logger.info(`Updated ${courses.length} courses`);
      
      // 완료
      loading.updateMessage('완료');
      
      setTimeout(() => {
        loading.stop();
        PromptDialog.alert(
          `업데이트 완료\n\n` +
          `회원: ${members.length}명\n` +
          `과정: ${courses.length}개`
        );
      }, 1000);
    } catch (error) {
      logger.error('Failed to update data', error);
      PromptDialog.alert(`업데이트 실패: ${error.message}`);
      
      // 버튼 상태 복원
      if (button) {
        button.setText('업데이트').setEnabled(true);
      }
    }
  };
}

/**
 * 전체 업데이트 실행
 * @returns {Promise<void>}
 */
export async function updateAll() {
  try {
    logger.info('Starting full update...');
    
    const [members, courses] = await Promise.all([
      MemberService.updateMembers(),
      CourseService.updateCourses(),
    ]);
    
    logger.info('Full update completed', {
      members: members.length,
      courses: courses.length,
    });
    
    return { members, courses };
  } catch (error) {
    logger.error('Failed to update all data', error);
    throw error;
  }
}
