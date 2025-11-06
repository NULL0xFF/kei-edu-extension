/**
 * UI components
 */

import {UI} from '../config/constants.js';
import {logger} from '../core/error-handler.js';
import {formatDate} from '../utils/date.js';

export class Button {
  constructor(text, className, title = '') {
    this.element = document.createElement('button');
    this.element.innerHTML = `<span class="txt_white">${text}</span>`;
    this.element.className = className;
    this.element.title = title || text;
    this.originalText = text;
  }

  onClick(handler) {
    this.element.onclick = handler;
    return this;
  }

  setEnabled(enabled) {
    this.element.disabled = !enabled;
    return this;
  }

  setText(text) {
    this.element.innerHTML = `<span class="txt_white">${text}</span>`;
    return this;
  }

  appendTo(parent) {
    parent.appendChild(this.element);
    return this;
  }

  getElement() {
    return this.element;
  }
}

export function createStatisticsButton() {
  return new Button('통계', UI.BUTTON_CLASS.PRIMARY, '통계 생성');
}

export function createUpdateButton() {
  return new Button('업데이트', UI.BUTTON_CLASS.SECONDARY, '데이터 업데이트');
}

export function getButtonContainer() {
  const containers = document.getElementsByClassName('btn_rightArea');
  if (containers.length === 0) {
    logger.error('Button container not found');
    return null;
  }
  return containers[0];
}

export class LoadingIndicator {
  constructor(button) {
    this.button = button;
    this.originalText = button.originalText;
  }

  start(message = '진행 중...') {
    this.button.setText(message).setEnabled(false);
  }

  stop() {
    this.button.setText(this.originalText).setEnabled(true);
  }

  updateMessage(message) {
    this.button.setText(message);
  }
}

export class Dialog {
  static prompt(message, defaultValue = '') {
    return window.prompt(message, defaultValue);
  }

  static alert(message) {
    window.alert(message);
  }

  static confirm(message) {
    return window.confirm(message);
  }
}

export function getSearchInput() {
  const keyword = Dialog.prompt('검색 키워드를 입력하세요', '');
  if (keyword === null) {
    return null;
  }

  const now = new Date();
  const currentYear = now.getFullYear();

  const defaultStartDate = formatDate(new Date(currentYear, 0, 1), '-');
  const defaultEndDate = formatDate(new Date(currentYear, 11, 31), '-');

  const startDate = Dialog.prompt(
      '시작일을 입력하세요 (YYYY-MM-DD)',
      defaultStartDate
  );
  if (!startDate) {
    Dialog.alert('유효한 시작일을 입력하세요');
    return null;
  }

  const endDate = Dialog.prompt(
      '종료일을 입력하세요 (YYYY-MM-DD)',
      defaultEndDate
  );
  if (!endDate) {
    Dialog.alert('유효한 종료일을 입력하세요');
    return null;
  }

  return {keyword, startDate, endDate};
}

export function setupAutoRefresh(intervalMinutes) {
  logger.info(`Auto-refresh enabled: ${intervalMinutes} minute(s)`);
  setInterval(() => {
    location.reload();
  }, intervalMinutes * 60 * 1000);
  logger.info(`Page loaded at: ${new Date().toLocaleString()}`);
}