import Logger from './logger.js';

const logger = new Logger('dashboard');

/**
 * 지정한 간격마다 페이지를 새로고침한다
 * @param {number} intervalInMinutes - 새로고침 간격(분)
 * @returns {void}
 */
function refreshPage(intervalInMinutes) {
  logger.debug(`Refresh every ${intervalInMinutes} minute(s)`);

  // 지정한 간격마다 페이지 새로고침
  setInterval(function () {
    location.reload();
  }, intervalInMinutes * 60 * 1000); // 분을 밀리초로 변환

  // 초기 페이지 로드 시각 로그
  logger.debug(`Page loaded at: ${new Date().toLocaleString()}`);
}

if (window.location.href.includes("cmmn/main.do")) {
  refreshPage(1);
}

