/**
 * 导入工具函数
 * 支持CSV和Excel文件解析、验证和映射
 */

import * as XLSX from 'xlsx';
import Papa from 'papaparse';

// 导入数据行
export interface ImportRow {
  rowIndex: number;
  data: Record<string, unknown>;
  errors: ImportError[];
  isValid: boolean;
}

// 导入错误
export interface ImportError {
  field: string;
  message: string;
  code: ImportErrorCode;
}

// 错误代码
export type ImportErrorCode = 
  | 'REQUIRED'
  | 'INVALID_EMAIL'
  | 'INVALID_PHONE'
  | 'INVALID_NUMBER'
  | 'INVALID_DATE'
  | 'INVALID_ENUM'
  | 'DUPLICATE'
  | 'MAX_LENGTH'
  | 'UNKNOWN';

// 字段定义
export interface FieldDefinition {
  key: string;
  label: string;
  required?: boolean;
  type: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'email' | 'phone';
  enumValues?: Record<string, string>;
  maxLength?: number;
  unique?: boolean;
  mapping?: Record<string, string>;
}

// 解析选项
export interface ParseOptions {
  file: File;
  skipEmptyRows?: boolean;
  hasHeader?: boolean;
}

// 解析结果
export interface ParseResult {
  headers: string[];
  rows: Record<string, unknown>[];
  rawData: string[][];
}

// 验证结果
export interface ValidationResult {
  validRows: ImportRow[];
  invalidRows: ImportRow[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    errorsByField: Record<string, number>;
  };
}

// 导入结果
export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
}

// 解析CSV文件
export function parseCSV(options: ParseOptions): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse(options.file, {
      encoding: 'UTF-8',
      skipEmptyLines: options.skipEmptyRows ?? true,
      complete: (results) => {
        const data = results.data as string[][];
        if (data.length === 0) {
          resolve({ headers: [], rows: [], rawData: [] });
          return;
        }
        
        const hasHeader = options.hasHeader ?? true;
        const headers = hasHeader ? data[0] : data[0].map((_, i) => `列${i + 1}`);
        const rows = hasHeader ? data.slice(1) : data;
        
        const parsedRows = rows.map(row => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        resolve({
          headers,
          rows: parsedRows,
          rawData: data,
        });
      },
      error: (error) => {
        reject(new Error(`CSV解析失败: ${error.message}`));
      },
    });
  });
}

// 解析Excel文件
export async function parseExcel(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
        
        if (rawData.length === 0) {
          resolve({ headers: [], rows: [], rawData: [] });
          return;
        }
        
        const headers = rawData[0].map(h => String(h || ''));
        const rows = rawData.slice(1).map(row => {
          const obj: Record<string, unknown> = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        resolve({
          headers,
          rows,
          rawData,
        });
      } catch (error) {
        reject(new Error(`Excel解析失败: ${(error as Error).message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

// 智能解析文件
export async function parseFile(options: ParseOptions): Promise<ParseResult> {
  const fileName = options.file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return parseCSV(options);
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return parseExcel(options.file);
  } else {
    throw new Error('不支持的文件格式，请上传CSV或Excel文件');
  }
}

// 验证单行数据
export function validateRow(
  row: Record<string, unknown>,
  fields: FieldDefinition[],
  rowIndex: number,
  existingValues?: Set<string>
): ImportRow {
  const errors: ImportError[] = [];
  
  for (const field of fields) {
    const value = row[field.label];
    const stringValue = String(value || '').trim();
    
    // 必填验证
    if (field.required && !stringValue) {
      errors.push({
        field: field.label,
        message: `${field.label}不能为空`,
        code: 'REQUIRED',
      });
      continue;
    }
    
    if (!stringValue) continue;
    
    // 最大长度验证
    if (field.maxLength && stringValue.length > field.maxLength) {
      errors.push({
        field: field.label,
        message: `${field.label}长度不能超过${field.maxLength}个字符`,
        code: 'MAX_LENGTH',
      });
    }
    
    // 类型验证
    switch (field.type) {
      case 'email':
        if (!isValidEmail(stringValue)) {
          errors.push({
            field: field.label,
            message: `${field.label}格式不正确，请输入有效的邮箱地址`,
            code: 'INVALID_EMAIL',
          });
        }
        break;
        
      case 'phone':
        if (!isValidPhone(stringValue)) {
          errors.push({
            field: field.label,
            message: `${field.label}格式不正确，请输入有效的电话号码`,
            code: 'INVALID_PHONE',
          });
        }
        break;
        
      case 'number':
        if (!isValidNumber(stringValue)) {
          errors.push({
            field: field.label,
            message: `${field.label}必须是有效的数字`,
            code: 'INVALID_NUMBER',
          });
        }
        break;
        
      case 'date':
        if (!isValidDate(stringValue)) {
          errors.push({
            field: field.label,
            message: `${field.label}格式不正确，请输入有效的日期`,
            code: 'INVALID_DATE',
          });
        }
        break;
        
      case 'enum':
        if (field.enumValues && !field.enumValues[stringValue] && !field.mapping?.[stringValue]) {
          const validOptions = Object.values(field.enumValues).join('、');
          errors.push({
            field: field.label,
            message: `${field.label}的值不正确，有效选项：${validOptions}`,
            code: 'INVALID_ENUM',
          });
        }
        break;
        
      case 'boolean':
        if (!isValidBoolean(stringValue)) {
          errors.push({
            field: field.label,
            message: `${field.label}必须是是/否或true/false`,
            code: 'INVALID_ENUM',
          });
        }
        break;
    }
    
    // 唯一性验证
    if (field.unique && existingValues?.has(stringValue)) {
      errors.push({
        field: field.label,
        message: `${field.label}的值${stringValue}已存在，不能重复`,
        code: 'DUPLICATE',
      });
    }
  }
  
  return {
    rowIndex,
    data: row,
    errors,
    isValid: errors.length === 0,
  };
}

// 批量验证
export function validateRows(
  rows: Record<string, unknown>[],
  fields: FieldDefinition[]
): ValidationResult {
  const validRows: ImportRow[] = [];
  const invalidRows: ImportRow[] = [];
  const errorsByField: Record<string, number> = {};
  
  // 收集唯一值
  const uniqueFields = fields.filter(f => f.unique);
  const existingValues = new Map<string, Set<string>>();
  uniqueFields.forEach(f => {
    existingValues.set(f.label, new Set());
  });
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = validateRow(row, fields, i + 1);
    
    // 更新唯一值集合
    uniqueFields.forEach(f => {
      const value = String(row[f.label] || '').trim();
      if (value) {
        existingValues.get(f.label)?.add(value);
      }
    });
    
    if (result.isValid) {
      validRows.push(result);
    } else {
      invalidRows.push(result);
      result.errors.forEach(err => {
        errorsByField[err.field] = (errorsByField[err.field] || 0) + 1;
      });
    }
  }
  
  return {
    validRows,
    invalidRows,
    summary: {
      total: rows.length,
      valid: validRows.length,
      invalid: invalidRows.length,
      errorsByField,
    },
  };
}

// 字段映射
export function mapFields(
  row: Record<string, unknown>,
  mapping: Record<string, string>
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {};
  
  for (const [targetKey, sourceKey] of Object.entries(mapping)) {
    if (sourceKey in row) {
      mapped[targetKey] = row[sourceKey];
    }
  }
  
  return mapped;
}

// 转换数据类型
export function convertValue(value: unknown, type: FieldDefinition['type']): unknown {
  if (value === null || value === undefined || value === '') return null;
  
  const stringValue = String(value).trim();
  
  switch (type) {
    case 'number':
      return parseFloat(stringValue) || null;
    case 'boolean':
      return isValidBoolean(stringValue);
    case 'date':
      return stringValue;
    case 'enum':
      return stringValue;
    default:
      return stringValue;
  }
}

// 验证函数
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  // 支持国际格式、国内手机号、固定电话
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

function isValidNumber(value: string): boolean {
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
}

function isValidDate(value: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function isValidBoolean(value: string): boolean {
  const lower = value.toLowerCase();
  return ['是', '否', 'true', 'false', '1', '0', 'yes', 'no'].includes(lower);
}

// 预定义的字段配置
export const CUSTOMER_FIELDS: FieldDefinition[] = [
  { key: 'name', label: '姓名', required: true, type: 'string', maxLength: 100 },
  { key: 'email', label: '邮箱', type: 'email' },
  { key: 'phone', label: '电话', type: 'phone' },
  { key: 'company', label: '公司', type: 'string', maxLength: 200 },
  { key: 'status', label: '状态', type: 'enum', enumValues: { '活跃': 'active', '非活跃': 'inactive', '潜在客户': 'prospect' } },
  { key: 'industry', label: '行业', type: 'string', maxLength: 100 },
  { key: 'website', label: '网站', type: 'string', maxLength: 500 },
  { key: 'address', label: '地址', type: 'string', maxLength: 500 },
  { key: 'notes', label: '备注', type: 'string', maxLength: 2000 },
];

export const CONTACT_FIELDS: FieldDefinition[] = [
  { key: 'first_name', label: '名', required: true, type: 'string', maxLength: 50 },
  { key: 'last_name', label: '姓', required: true, type: 'string', maxLength: 50 },
  { key: 'email', label: '邮箱', type: 'email' },
  { key: 'phone', label: '电话', type: 'phone' },
  { key: 'position', label: '职位', type: 'string', maxLength: 100 },
  { key: 'customer_name', label: '客户名称', type: 'string', maxLength: 200 },
  { key: 'is_primary', label: '是否主要联系人', type: 'boolean' },
];

export const LEAD_FIELDS: FieldDefinition[] = [
  { key: 'title', label: '标题', required: true, type: 'string', maxLength: 200 },
  { key: 'source', label: '来源', type: 'enum', enumValues: { '转介绍': 'referral', '网站': 'website', '电话拓展': 'cold_call', '活动': 'event', '广告': 'advertisement', '其他': 'other' } },
  { key: 'customer_name', label: '客户名称', type: 'string', maxLength: 200 },
  { key: 'contact_name', label: '联系人名称', type: 'string', maxLength: 100 },
  { key: 'estimated_value', label: '预估金额', type: 'number' },
  { key: 'probability', label: '概率(%)', type: 'number' },
  { key: 'status', label: '状态', type: 'enum', enumValues: { '新线索': 'new', '已联系': 'contacted', '已筛选': 'qualified', '已淘汰': 'disqualified' } },
  { key: 'notes', label: '备注', type: 'string', maxLength: 2000 },
];

export const OPPORTUNITY_FIELDS: FieldDefinition[] = [
  { key: 'title', label: '标题', required: true, type: 'string', maxLength: 200 },
  { key: 'customer_name', label: '客户名称', type: 'string', maxLength: 200 },
  { key: 'contact_name', label: '联系人名称', type: 'string', maxLength: 100 },
  { key: 'value', label: '金额', type: 'number' },
  { key: 'stage', label: '阶段', type: 'enum', enumValues: { '筛选': 'qualified', '需求发现': 'discovery', '方案报价': 'proposal', '商务谈判': 'negotiation', '合同签订': 'contract', '成交': 'closed_won', '失败': 'closed_lost' } },
  { key: 'probability', label: '概率(%)', type: 'number' },
  { key: 'expected_close_date', label: '预计成交日期', type: 'date' },
  { key: 'description', label: '描述', type: 'string', maxLength: 2000 },
];

// 错误信息格式化
export function formatErrors(errors: ImportError[]): string {
  return errors.map(e => `[${e.field}] ${e.message}`).join('\n');
}

// 生成错误报告
export function generateErrorReport(rows: ImportRow[]): string {
  const lines: string[] = ['导入错误报告', '='.repeat(50), ''];
  
  for (const row of rows) {
    lines.push(`第 ${row.rowIndex} 行:`);
    for (const error of row.errors) {
      lines.push(`  - [${error.field}] ${error.message}`);
    }
    lines.push('');
  }
  
  return lines.join('\n');
}
