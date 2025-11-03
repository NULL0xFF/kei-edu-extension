/**
 * UI event handlers
 */

import {CourseService} from '../services/course.service.js';
import {MemberService} from '../services/member.service.js';
import {StatisticsService} from '../services/statistics.service.js';
import {logger} from '../core/error-handler.js';
import {Dialog, getSearchInput, LoadingIndicator} from './components.js';

export function createStatisticsClickHandler(button) {
  return async function () {
    try {
      const input = getSearchInput();
      if (!input) {
        return;
      }

      const loading = new LoadingIndicator(button);
      loading.start('통계 생성 중...');

      // Bind logger to button for progress updates
      logger.setButtonElement(button.getElement());

      const records = await StatisticsService.generateStats({
        keyword: input.keyword,
        startDate: input.startDate,
        endDate: input.endDate
      });

      if (records.length === 0) {
        Dialog.alert('검색 결과가 없습니다.');
        loading.stop();
        logger.clearButtonElement();
        return;
      }

      // Export files
      loading.updateMessage('파일 생성 중...');
      const filename = `통계_${input.keyword || '전체'}`;
      StatisticsService.exportCSV(filename, records);
      StatisticsService.exportExcel(filename, records);
      StatisticsService.exportExcelWithDates(filename, records);

      // Summary
      const summary = StatisticsService.getSummary(records);
      logger.debug('Statistics summary:', summary);

      loading.stop();
      logger.clearButtonElement();

      Dialog.alert(
          `통계 생성 완료\n\n` +
          `대상 회원: ${summary.totalMembers}명\n` +
          `총 과정: ${summary.totalCourses}개\n` +
          `총 수료: ${summary.totalCompletions}건\n` +
          `평균 이수 시간: ${summary.averageCompletionTime}시간`
      );
    } catch (error) {
      logger.error('Failed to generate statistics', error);
      logger.clearButtonElement();
      Dialog.alert(`통계 생성 실패: ${error.message}`);

      if (button) {
        button.setText('통계').setEnabled(true);
      }
    }
  };
}

export function createUpdateClickHandler(button) {
  return async function () {
    try {
      const yearInput = Dialog.prompt(
          '데이터를 업데이트할 연도를 입력하세요 (YYYY)',
          new Date().getFullYear().toString()
      );

      if (yearInput === null) {
        return;
      }

      if (!/^\d{4}$/.test(yearInput)) {
        Dialog.alert('유효한 연도를 입력하세요 (예: 2024)');
        return;
      }

      const year = parseInt(yearInput, 10);
      const loading = new LoadingIndicator(button);

      // Bind logger to button for progress updates
      logger.setButtonElement(button.getElement());

      // Update members (all)
      loading.start('회원 업데이트 중...');
      const members = await MemberService.updateMembers();
      logger.debug(`Updated ${members.length} members`);

      // Update courses (filtered by year)
      loading.updateMessage(`${year}년 과정 업데이트 중...`);
      const courses = await CourseService.updateCourses(year);
      const updatedCount = courses.filter(c => c.csYear === year).length;
      logger.debug(`Updated ${updatedCount} courses for year ${year}`);

      loading.updateMessage('완료');
      logger.clearButtonElement();

      setTimeout(() => {
        loading.stop();
        Dialog.alert(
            `업데이트 완료 (대상 연도: ${year})\n\n` +
            `전체 회원: ${members.length}명\n` +
            `${year}년 과정: ${updatedCount}개`
        );
      }, 1000);
    } catch (error) {
      logger.error('Failed to update data', error);
      logger.clearButtonElement();
      Dialog.alert(`업데이트 실패: ${error.message}`);

      if (button) {
        button.setText('업데이트').setEnabled(true);
      }
    }
  };
}
