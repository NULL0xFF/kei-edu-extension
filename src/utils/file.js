/**
 * @file file.js
 * @description 파일 처리 유틸리티
 */

import * as XLSX from 'xlsx';
import { EXPORT } from '../config/constants.js';
import { getFileTimestamp } from './date.js';
import { logger } from '../core/error-handler.js';

/**
 * CSV 파일 생성 및 다운로드
 * @param {string} filename - 파일명
 * @param {Array<Array<string>>} data - 2차원 배열 데이터
 */
export function downloadCSV(filename, data) {
  try {
    // 2차원 배열을 CSV 문자열로 변환
    const csvContent = data.map(row => row.join(',')).join('\n');
    
    // BOM 추가 (Excel에서 한글 깨짐 방지)
    const blob = new Blob(
      [EXPORT.CSV_BOM + csvContent],
      { type: 'text/csv;charset=utf-8;' }
    );
    
    // 다운로드
    downloadBlob(blob, `${filename}_${getFileTimestamp()}.csv`);
    
    logger.info(`CSV file downloaded: ${filename}`);
  } catch (error) {
    logger.error('Failed to download CSV file', error);
    throw error;
  }
}

/**
 * Excel 파일 생성 및 다운로드
 * @param {string} filename - 파일명
 * @param {Array<Object>} data - 객체 배열 데이터
 * @param {Object} options - 옵션
 */
export function downloadExcel(filename, data, options = {}) {
  try {
    const {
      sheetName = 'Sheet1',
      columns = null,
    } = options;
    
    // 데이터 준비
    let worksheetData = data;
    if (columns) {
      // 지정된 컬럼만 선택
      worksheetData = data.map(row => {
        const filtered = {};
        columns.forEach(col => {
          filtered[col.header] = row[col.key];
        });
        return filtered;
      });
    }
    
    // 워크북 생성
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // 파일 생성 및 다운로드
    XLSX.writeFile(workbook, `${filename}_${getFileTimestamp()}.xlsx`);
    
    logger.info(`Excel file downloaded: ${filename}`);
  } catch (error) {
    logger.error('Failed to download Excel file', error);
    throw error;
  }
}

/**
 * Blob을 파일로 다운로드
 * @param {Blob} blob - Blob 객체
 * @param {string} filename - 파일명
 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 데이터를 CSV 형식으로 변환
 * @param {Array<Object>} data - 객체 배열
 * @param {Array<string>} headers - 헤더 배열
 * @returns {Array<Array<string>>}
 */
export function convertToCSVData(data, headers) {
  const rows = [headers];
  
  data.forEach(item => {
    const row = headers.map(header => {
      const value = item[header];
      // 값이 문자열이고 쉼표나 줄바꿈이 포함된 경우 따옴표로 감싸기
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value != null ? String(value) : '';
    });
    rows.push(row);
  });
  
  return rows;
}

/**
 * 파일 크기를 읽기 쉬운 형식으로 변환
 * @param {number} bytes - 바이트 크기
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
