/**
 * @file dashboard.js
 * @description Dashboard auto-refresh functionality
 */

import { createLogger } from './shared.js';

// Create logger for dashboard component
const logger = createLogger('DASHBOARD');

/**
 * Refresh the page every specified interval
 * @param {number} intervalInMinutes - The interval in minutes to refresh the page.
 * @returns {void}
 */
function refreshPage(intervalInMinutes) {
  logger.info(`Setting up page refresh every ${intervalInMinutes} minute(s)`);

  // Refresh the page every specified interval
  setInterval(function () {
    logger.info('Auto-refreshing page');
    location.reload();
  }, intervalInMinutes * 60 * 1000); // Convert minutes to milliseconds

  // Log the initial page load timestamp
  logger.info(`Page loaded at: ${new Date().toLocaleString()}`);
}

if (window.location.href.includes("cmmn/main.do")) {
  logger.debug('Dashboard page detected, initializing auto-refresh');
  refreshPage(1);
}