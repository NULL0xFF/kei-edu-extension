/**
 * @file components.js
 * @description UI 컴포넌트
 */

import { UI } from '../config/constants.js';
import { logger } from '../core/error-handler.js';

/**
 * 버튼 컴포넌트 클래스
 */
export class Button {
  constructor(text, className, title = '') {
    this.element = document.createElement('button');
    this.element.innerHTML = `<span class="txt_white">${text}</span>`;
    this.element.className = className;
    this.element.title = title || text;
  }

  /**
   * 클릭 이벤트 핸들러 설정
   * @param {Function} handler - 이벤트 핸들러
   */
  onClick(handler) {
    this.element.onclick = handler;
    return this;
  }

  /**
   * 버튼 활성화/비활성화
   * @param {boolean} enabled - 활성화 여부
   */
  setEnabled(enabled) {
    this.element.disabled = !enabled;
    return this;
  }

  /**
   * 버튼 텍스트 변경
   * @param {string} text - 새 텍스트
   */
  setText(text) {
    this.element.innerHTML = `<span class="txt_white">${text}</span>`;
    return this;
  }

  /**
   * DOM에 추가
   * @param {HTMLElement} parent - 부모 요소
   */
  appendTo(parent) {
    parent.appendChild(this.element);
    return this;
  }

  /**
   * DOM 요소 반환
   * @returns {HTMLElement}
   */
  getElement() {
    return this.element;
  }
}

/**
 * 통계 버튼 생성
 * @returns {Button}
 */
export function createStatisticsButton() {
  return new Button(
    '통계',
    UI.BUTTON_CLASS.STATISTICS,
    '통계'
  );
}

/**
 * 업데이트 버튼 생성
 * @returns {Button}
 */
export function createUpdateButton() {
  return new Button(
    '업데이트',
    UI.BUTTON_CLASS.UPDATE,
    '업데이트'
  );
}

/**
 * 프롬프트 다이얼로그
 */
export class PromptDialog {
  /**
   * 입력 프롬프트 표시
   * @param {string} message - 메시지
   * @param {string} defaultValue - 기본값
   * @returns {string|null}
   */
  static prompt(message, defaultValue = '') {
    return window.prompt(message, defaultValue);
  }

  /**
   * 경고 표시
   * @param {string} message - 메시지
   */
  static alert(message) {
    window.alert(message);
  }

  /**
   * 확인 다이얼로그
   * @param {string} message - 메시지
   * @returns {boolean}
   */
  static confirm(message) {
    return window.confirm(message);
  }
}

/**
 * 검색 입력 받기
 * @returns {Object|null}
 */
export function getSearchInput() {
  const keyword = PromptDialog.prompt('검색 키워드를 입력하세요', '');
  if (keyword === null) {
    return null;
  }
  
  const startDate = PromptDialog.prompt(
    '시작일을 입력하세요 (YYYY-MM-DD)',
    '2024-01-01'
  );
  if (!startDate) {
    PromptDialog.alert('유효한 시작일을 입력하세요');
    return null;
  }
  
  const endDate = PromptDialog.prompt(
    '종료일을 입력하세요 (YYYY-MM-DD)',
    '2024-12-31'
  );
  if (!endDate) {
    PromptDialog.alert('유효한 종료일을 입력하세요');
    return null;
  }
  
  return { keyword, startDate, endDate };
}

/**
 * 버튼 컨테이너 찾기
 * @returns {HTMLElement|null}
 */
export function getButtonContainer() {
  const containers = document.getElementsByClassName('btn_rightArea');
  if (containers.length === 0) {
    logger.error('Button container not found');
    return null;
  }
  return containers[0];
}

/**
 * 로딩 상태 표시
 */
export class LoadingIndicator {
  constructor(button) {
    this.button = button;
    this.originalText = '';
  }

  /**
   * 로딩 시작
   * @param {string} message - 로딩 메시지
   */
  start(message = '진행 중...') {
    this.originalText = this.button.element.innerHTML;
    this.button.setText(message).setEnabled(false);
  }

  /**
   * 로딩 종료
   */
  stop() {
    this.button.element.innerHTML = this.originalText;
    this.button.setEnabled(true);
  }

  /**
   * 메시지 업데이트
   * @param {string} message - 새 메시지
   */
  updateMessage(message) {
    this.button.setText(message);
  }
}

/**
 * 대시보드 자동 새로고침 설정
 * @param {number} intervalMinutes - 새로고침 간격 (분)
 */
export function setupAutoRefresh(intervalMinutes) {
  logger.info(`Setting up auto-refresh every ${intervalMinutes} minute(s)`);
  
  setInterval(() => {
    location.reload();
  }, intervalMinutes * 60 * 1000);
  
  logger.info(`Page loaded at: ${new Date().toLocaleString()}`);
}
