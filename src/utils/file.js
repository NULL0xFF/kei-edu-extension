/**
 * File export utilities
 */

import * as XLSX from 'xlsx';
import {EXPORT} from '../config/constants.js';
import {getFileTimestamp} from './date.js';
import {logger} from '../core/error-handler.js';

export function downloadCSV(filename, data) {
  try {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const blob = new Blob(
        [EXPORT.CSV_BOM + csvContent],
        {type: 'text/csv;charset=utf-8;'}
    );
    downloadBlob(blob, `${filename}_${getFileTimestamp()}.csv`);
    logger.info(`CSV downloaded: ${filename}`);
  } catch (error) {
    logger.error('Failed to download CSV', error);
    throw error;
  }
}

export function downloadExcel(filename, data, sheetName = 'Sheet1') {
  try {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}_${getFileTimestamp()}.xlsx`);
    logger.info(`Excel downloaded: ${filename}`);
  } catch (error) {
    logger.error('Failed to download Excel', error);
    throw error;
  }
}

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
