/**
 * 导出工具函数
 * 支持CSV和Excel格式导出
 */

import * as XLSX from 'xlsx';

// CSV转义函数
export function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? '是' : '否';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 数据类型定义
export interface ExportColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  formatter?: (value: unknown, row: T) => string;
}

// 导出选项
export interface ExportOptions {
  fileName: string;
  format: 'csv' | 'xlsx';
  sheetName?: string;
  includeBOM?: boolean;
}

// 通用导出函数
export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: Partial<ExportOptions> = {}
): string {
  const { includeBOM = true } = options;
  
  // 生成表头
  const headers = columns.map(col => escapeCSV(col.header));
  const rows: string[][] = [headers];
  
  // 生成数据行
  for (const item of data) {
    const row = columns.map(col => {
      const value = col.key in item ? item[col.key as keyof T] : undefined;
      if (col.formatter) {
        return escapeCSV(col.formatter(value, item));
      }
      return escapeCSV(value);
    });
    rows.push(row);
  }
  
  // 转换为CSV字符串
  const csvContent = rows.map(row => row.join(',')).join('\n');
  const bom = includeBOM ? '\uFEFF' : '';
  
  return bom + csvContent;
}

// Excel导出函数
export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: Partial<ExportOptions> = {}
): Uint8Array {
  const { sheetName = 'Sheet1' } = options;
  
  // 生成表头
  const headers = columns.map(col => col.header);
  const rows: (string | number | boolean | null)[][] = [headers];
  
  // 生成数据行
  for (const item of data) {
    const row = columns.map(col => {
      const value = col.key in item ? item[col.key as keyof T] : undefined;
      if (col.formatter) {
        return col.formatter(value, item);
      }
      return value ?? null;
    });
    rows.push(row as (string | number | boolean | null)[]);
  }
  
  // 创建工作簿
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  
  // 设置列宽
  worksheet['!cols'] = columns.map(() => ({ wch: 20 }));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // 生成二进制文件
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  return new Uint8Array(excelBuffer);
}

// 下载文件
export function downloadFile(content: string | Uint8Array, fileName: string, mimeType: string): void {
  const blob = new Blob([content as BlobPart], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 下载CSV
export function downloadCSV(content: string, fileName: string): void {
  downloadFile(content, fileName, 'text/csv;charset=utf-8');
}

// 下载Excel
export function downloadExcel(content: Uint8Array, fileName: string): void {
  downloadFile(content, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

// 通用导出函数（自动选择格式）
export function exportData<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  options: ExportOptions
): void {
  const { fileName, format, includeBOM = true } = options;
  
  if (format === 'csv') {
    const csv = exportToCSV(data, columns, { includeBOM });
    downloadCSV(csv, `${fileName}.csv`);
  } else {
    const excel = exportToExcel(data, columns, { sheetName: options.sheetName });
    downloadExcel(excel, `${fileName}.xlsx`);
  }
}

// 预定义的字段配置
export const CUSTOMER_COLUMNS: ExportColumn<Record<string, unknown>>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: '姓名' },
  { key: 'email', header: '邮箱' },
  { key: 'phone', header: '电话' },
  { key: 'company', header: '公司' },
  { key: 'status', header: '状态', formatter: (v) => STATUS_LABELS[v as string] || v as string },
  { key: 'industry', header: '行业' },
  { key: 'website', header: '网站' },
  { key: 'address', header: '地址' },
  { key: 'notes', header: '备注' },
  { key: 'created_at', header: '创建时间', formatter: (v) => formatDate(v) },
  { key: 'updated_at', header: '更新时间', formatter: (v) => formatDate(v) },
];

export const CONTACT_COLUMNS: ExportColumn<Record<string, unknown>>[] = [
  { key: 'id', header: 'ID' },
  { key: 'first_name', header: '名' },
  { key: 'last_name', header: '姓' },
  { key: 'email', header: '邮箱' },
  { key: 'phone', header: '电话' },
  { key: 'position', header: '职位' },
  { key: 'customer_name', header: '客户名称' },
  { key: 'is_primary', header: '是否主要联系人', formatter: (v) => v ? '是' : '否' },
  { key: 'created_at', header: '创建时间', formatter: (v) => formatDate(v) },
  { key: 'updated_at', header: '更新时间', formatter: (v) => formatDate(v) },
];

export const LEAD_COLUMNS: ExportColumn<Record<string, unknown>>[] = [
  { key: 'id', header: 'ID' },
  { key: 'title', header: '标题' },
  { key: 'source', header: '来源', formatter: (v) => SOURCE_LABELS[v as string] || v as string },
  { key: 'customer_name', header: '客户名称' },
  { key: 'contact_name', header: '联系人名称' },
  { key: 'estimated_value', header: '预估金额', formatter: (v) => formatCurrency(v) },
  { key: 'probability', header: '概率(%)' },
  { key: 'status', header: '状态', formatter: (v) => LEAD_STATUS_LABELS[v as string] || v as string },
  { key: 'notes', header: '备注' },
  { key: 'created_at', header: '创建时间', formatter: (v) => formatDate(v) },
  { key: 'updated_at', header: '更新时间', formatter: (v) => formatDate(v) },
];

export const OPPORTUNITY_COLUMNS: ExportColumn<Record<string, unknown>>[] = [
  { key: 'id', header: 'ID' },
  { key: 'title', header: '标题' },
  { key: 'customer_name', header: '客户名称' },
  { key: 'contact_name', header: '联系人名称' },
  { key: 'value', header: '金额', formatter: (v) => formatCurrency(v) },
  { key: 'stage', header: '阶段', formatter: (v) => STAGE_LABELS[v as string] || v as string },
  { key: 'probability', header: '概率(%)' },
  { key: 'expected_close_date', header: '预计成交日期' },
  { key: 'description', header: '描述' },
  { key: 'created_at', header: '创建时间', formatter: (v) => formatDate(v) },
  { key: 'updated_at', header: '更新时间', formatter: (v) => formatDate(v) },
];

// 标签映射
const STATUS_LABELS: Record<string, string> = {
  active: '活跃',
  inactive: '非活跃',
  prospect: '潜在客户',
};

const SOURCE_LABELS: Record<string, string> = {
  referral: '转介绍',
  website: '网站',
  cold_call: '电话拓展',
  event: '活动',
  advertisement: '广告',
  other: '其他',
};

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: '新线索',
  contacted: '已联系',
  qualified: '已筛选',
  disqualified: '已淘汰',
};

const STAGE_LABELS: Record<string, string> = {
  qualified: '筛选',
  discovery: '需求发现',
  proposal: '方案报价',
  negotiation: '商务谈判',
  contract: '合同签订',
  closed_won: '成交',
  closed_lost: '失败',
};

// 格式化工具函数
function formatDate(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    try {
      const date = new Date(value);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch {
      return value;
    }
  }
  return String(value);
}

function formatCurrency(value: unknown): string {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
