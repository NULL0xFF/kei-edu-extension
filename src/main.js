/**
 * Main entry point
 */

import {logger} from './core/error-handler.js';
import {UI} from './config/constants.js';
import {
  createStatisticsButton,
  createUpdateButton,
  getButtonContainer,
  setupAutoRefresh
} from './ui/components.js';
import {
  createStatisticsClickHandler,
  createUpdateClickHandler
} from './ui/handlers.js';

function initMemberListPage() {
  logger.info('Initializing member list page...');

  const container = getButtonContainer();
  if (!container) {
    logger.error('Failed to find button container');
    return;
  }

  try {
    // Statistics button
    const statisticsButton = createStatisticsButton();
    statisticsButton.onClick(createStatisticsClickHandler(statisticsButton));
    statisticsButton.appendTo(container);
    logger.info('Statistics button added');

    // Update button
    const updateButton = createUpdateButton();
    updateButton.onClick(createUpdateClickHandler(updateButton));
    updateButton.appendTo(container);
    logger.info('Update button added');

    logger.info('Member list page initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize member list page', error);
  }
}

function initDashboardPage() {
  logger.info('Initializing dashboard page...');

  try {
    setupAutoRefresh(UI.REFRESH_INTERVAL);
    logger.info('Dashboard auto-refresh enabled');
  } catch (error) {
    logger.error('Failed to initialize dashboard page', error);
  }
}

function init() {
  logger.info('KEI Edu Admin Tools v2.0.0 initializing...');

  const url = window.location.href;

  if (url.includes('user/member/memberList.do')) {
    initMemberListPage();
  } else if (url.includes('cmmn/main.do')) {
    initDashboardPage();
  }

  logger.info('KEI Edu Admin Tools v2.0.0 initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export {init};
