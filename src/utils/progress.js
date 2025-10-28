/**
 * @file progress.js
 * @description 진행률 표시 유틸리티
 */

import { logger } from '../core/error-handler.js';

/**
 * 진행률 추적기 클래스
 */
export class ProgressTracker {
  constructor(total, label = 'Progress') {
    this.total = total;
    this.current = 0;
    this.startTime = Date.now();
    this.label = label;
    this.lastUpdateTime = this.startTime;
    this.updateInterval = 1000; // Update console every 1 second
  }

  /**
   * 진행률 업데이트
   * @param {number} current - 현재 진행 수
   */
  update(current) {
    this.current = current;
    
    const now = Date.now();
    if (now - this.lastUpdateTime >= this.updateInterval) {
      this.logProgress();
      this.lastUpdateTime = now;
    }
  }

  /**
   * 진행률 증가
   */
  increment() {
    this.update(this.current + 1);
  }

  /**
   * 진행률 계산
   * @returns {number} 백분율
   */
  getPercentage() {
    if (this.total === 0) return 0;
    return (this.current / this.total) * 100;
  }

  /**
   * 예상 남은 시간 계산
   * @returns {number} 밀리초 단위
   */
  getEstimatedTimeRemaining() {
    if (this.current === 0) return 0;
    
    const elapsed = Date.now() - this.startTime;
    const rate = this.current / elapsed;
    const remaining = this.total - this.current;
    
    return remaining / rate;
  }

  /**
   * 시간을 읽기 쉬운 형식으로 변환
   * @param {number} ms - 밀리초
   * @returns {string}
   */
  formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    } else {
      return `${seconds}초`;
    }
  }

  /**
   * 진행 상황 로깅
   */
  logProgress() {
    const percentage = this.getPercentage();
    const remaining = this.getEstimatedTimeRemaining();
    const timeStr = this.formatTime(remaining);
    
    logger.info(
      `${this.label}: [${this.current}/${this.total}] ${percentage.toFixed(1)}% - 예상 남은 시간: ${timeStr}`
    );
  }

  /**
   * 완료 메시지 출력
   */
  complete() {
    const elapsed = Date.now() - this.startTime;
    logger.info(
      `${this.label} 완료: ${this.total}개 처리 완료 (소요 시간: ${this.formatTime(elapsed)})`
    );
  }

  /**
   * 진행률 초기화
   */
  reset() {
    this.current = 0;
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
  }
}

/**
 * 간단한 진행률 표시 함수 (기존 코드 호환용)
 * @param {number} current - 현재 인덱스
 * @param {number} total - 전체 개수
 * @param {number} startTime - 시작 시간 (타임스탬프)
 * @param {string} label - 레이블
 */
export function showProgress(current, total, startTime, label = '') {
  if (current === 0) return;
  
  const elapsed = Date.now() - startTime;
  const rate = current / elapsed;
  const remaining = total - current;
  const estimatedRemaining = remaining / rate;
  
  const percentage = ((current / total) * 100).toFixed(1);
  const hours = Math.floor(estimatedRemaining / 3600000);
  const minutes = Math.floor((estimatedRemaining % 3600000) / 60000);
  const seconds = Math.floor((estimatedRemaining % 60000) / 1000);
  
  let timeStr = '';
  if (hours > 0) {
    timeStr = `${hours}시간 ${minutes}분`;
  } else if (minutes > 0) {
    timeStr = `${minutes}분 ${seconds}초`;
  } else {
    timeStr = `${seconds}초`;
  }
  
  const message = label
    ? `${label} : [${current}/${total}] ${percentage}% - 예상 남은 시간: ${timeStr}`
    : `[${current}/${total}] ${percentage}% - 예상 남은 시간: ${timeStr}`;
  
  console.log(message);
}
