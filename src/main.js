/**
 * @file main.js
 * @description 애플리케이션 메인 진입점
 */

import { logger } from './core/error-handler.js';
import { UI } from './config/constants.js';
import {
  createStatisticsButton,
  createUpdateButton,
  getButtonContainer,
  setupAutoRefresh,
} from './ui/components.js';
import {
  createStatisticsClickHandler,
  createUpdateClickHandler,
} from './ui/events.js';

/**
 * 회원 목록 페이지 초기화
 */
function initMemberListPage() {
  logger.info('Initializing member list page...');
  
  // 버튼 컨테이너 찾기
  const container = getButtonContainer();
  if (!container) {
    logger.error('Failed to find button container');
    return;
  }
  
  try {
    // 통계 버튼 생성 및 추가
    const statisticsButton = createStatisticsButton();
    statisticsButton.onClick(createStatisticsClickHandler(statisticsButton));
    statisticsButton.appendTo(container);
    logger.info('Statistics button added');
    
    // 업데이트 버튼 생성 및 추가
    const updateButton = createUpdateButton();
    updateButton.onClick(createUpdateClickHandler(updateButton));
    updateButton.appendTo(container);
    logger.info('Update button added');
    
    logger.info('Member list page initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize member list page', error);
  }
}

/**
 * 대시보드 페이지 초기화
 */
function initDashboardPage() {
  logger.info('Initializing dashboard page...');
  
  try {
    setupAutoRefresh(UI.REFRESH_INTERVAL);
    logger.info('Dashboard auto-refresh enabled');
  } catch (error) {
    logger.error('Failed to initialize dashboard page', error);
  }
}

/**
 * 애플리케이션 초기화
 */
function init() {
  logger.info('KEI Edu Admin Tools v2.0.0 initializing...');
  
  const url = window.location.href;
  
  // 회원 목록 페이지
  if (url.includes('user/member/memberList.do')) {
    initMemberListPage();
  }
  // 대시보드 페이지
  else if (url.includes('cmmn/main.do')) {
    initDashboardPage();
  }
  
  logger.info('KEI Edu Admin Tools v2.0.0 initialized');
}

// DOM 로드 완료 후 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// 모듈 내보내기 (테스트용)
export { init };
