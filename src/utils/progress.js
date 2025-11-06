/**
 * Progress tracking utilities
 */

import {logger} from '../core/error-handler.js';

export class ProgressTracker {
  constructor(total, label = 'Progress') {
    this.total = total;
    this.current = 0;
    this.startTime = Date.now();
    this.lastUpdateTime = this.startTime;
    this.updateInterval = 1000;
    this.label = label;
  }

  update(current) {
    this.current = current;
    const now = Date.now();
    if (now - this.lastUpdateTime >= this.updateInterval) {
      this.logProgress();
      this.lastUpdateTime = now;
    }
  }

  increment() {
    this.update(this.current + 1);
  }

  getPercentage() {
    return this.total === 0 ? 0 : (this.current / this.total) * 100;
  }

  getEstimatedTimeRemaining() {
    if (this.current === 0) {
      return 0;
    }
    const elapsed = Date.now() - this.startTime;
    const rate = this.current / elapsed;
    const remaining = this.total - this.current;
    return remaining / rate;
  }

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

  logProgress() {
    const percentage = this.getPercentage();
    const remaining = this.getEstimatedTimeRemaining();
    const timeStr = this.formatTime(remaining);
    const message = `${this.label}: [${this.current}/${this.total}] ${percentage.toFixed(
        1)}% - ETC: ${timeStr}`;

    // Use logger.info which will update button if element is set
    logger.info(message);
  }

  complete() {
    const elapsed = Date.now() - this.startTime;
    logger.info(
        `${this.label} 완료: ${this.total}개 처리 (소요: ${this.formatTime(elapsed)})`
    );
  }
}
