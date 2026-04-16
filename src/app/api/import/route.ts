/**
 * 导入API
 * 支持CSV和Excel文件导入
 */

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import * as db from '@/lib/crm-database';

// 字段定义
const ENTITY_FIELDS: Record<string, { required: string[]; optional: string[]; enumFields: Record<string, Record<string, string>> }> = {
  customers: {
    required: ['name'],
    optional: ['email', 'phone', 'company', 'status', 'industry', 'website', 'address', 'notes'],
    enumFields: {
      status: { '活跃': 'active', '非活跃': 'inactive', '潜在客户': 'prospect' }
    }
  },
  contacts: {
    required: ['first_name', 'last_name'],
    optional: ['email', 'phone', 'position', 'customer_name', 'is_primary'],
    enumFields: {}
  },
  leads: {
    required: ['title'],
    optional: ['source', 'customer_name', 'contact_name', 'estimated_value', 'probability', 'status', 'notes'],
    enumFields: {
      source: { '转介绍': 'referral', '网站': 'website', '电话拓展': 'cold_call', '活动': 'event', '广告': 'advertisement', '其他': 'other' },
      status: { '新线索': 'new', '已联系': 'contacted', '已筛选': 'qualified', '已淘汰': 'disqualified' }
    }
  },
  opportunities: {
    required: ['title'],
    optional: ['customer_name', 'contact_name', 'value', 'stage', 'probability', 'expected_close_date', 'description'],
    enumFields: {
      stage: { '筛选': 'qualified', '需求发现': 'discovery', '方案报价': 'proposal', '商务谈判': 'negotiation', '合同签订': 'contract', '成交': 'closed_won', '失败': 'closed_lost' }
    }
  },
};

// 验证邮箱
function isValidEmail(email: string): boolean {
  if (!email) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证电话
function isValidPhone(phone: string): boolean {
  if (!phone) return true;
  const phoneRegex = /^[\d\s\-\+\(\)]{7,20}$/;
  return phoneRegex.test(phone);
}

// 验证数字
function isValidNumber(value: string): boolean {
  if (!value) return true;
  return !isNaN(parseFloat(value)) && isFinite(Number(value));
}

// 验证布尔值
function isValidBoolean(value: string): boolean {
  if (!value) return true;
  const lower = value.toLowerCase();
  return ['是', '否', 'true', 'false', '1', '0', 'yes', 'no'].includes(lower);
}

// 解析布尔值
function parseBoolean(value: string): boolean {
  const lower = value.toLowerCase();
  return ['是', 'true', '1', 'yes'].includes(lower);
}

// 验证并转换枚举值
function convertEnum(value: string, enumMap: Record<string, string>): string {
  if (!value) return value;
  if (enumMap[value]) return enumMap[value];
  const reverseMap = Object.fromEntries(Object.entries(enumMap).map(([, v]) => [v, v]));
  return reverseMap[value] || value;
}

// 验证行数据
function validateRow(
  row: Record<string, string>,
  entityType: string,
  _rowIndex: number
): { valid: boolean; errors: Array<{ field: string; message: string }>; data: Record<string, unknown> } {
  const errors: Array<{ field: string; message: string }> = [];
  const config = ENTITY_FIELDS[entityType];
  const data: Record<string, unknown> = {};
  
  for (const field of config.required) {
    const value = row[field]?.trim();
    if (!value) {
      errors.push({ field, message: `${field}不能为空` });
    } else {
      data[field] = value;
    }
  }
  
  for (const field of config.optional) {
    const value = row[field]?.trim();
    if (value) {
      if (config.enumFields[field]) {
        data[field] = convertEnum(value, config.enumFields[field]);
      } else if (field.includes('value') || field.includes('probability')) {
        if (isValidNumber(value)) {
          data[field] = parseFloat(value);
        } else {
          errors.push({ field, message: `${field}必须是有效的数字` });
        }
      } else if (field === 'is_primary') {
        if (isValidBoolean(value)) {
          data[field] = parseBoolean(value);
        } else {
          errors.push({ field, message: `${field}必须是是/否或true/false` });
        }
      } else if (field === 'email') {
        if (isValidEmail(value)) {
          data[field] = value;
        } else {
          errors.push({ field, message: `${field}格式不正确` });
        }
      } else if (field === 'phone') {
        if (isValidPhone(value)) {
          data[field] = value;
        } else {
          errors.push({ field, message: `${field}格式不正确` });
        }
      } else {
        data[field] = value;
      }
    }
  }
  
  return { valid: errors.length === 0, errors, data };
}

// 解析文件
async function parseFile(file: File): Promise<string[][]> {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        encoding: 'UTF-8',
        skipEmptyLines: true,
        complete: (results) => resolve(results.data as string[][]),
        error: (error) => reject(new Error(`CSV解析失败: ${error.message}`)),
      });
    });
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const workbook = XLSX.read(e.target?.result, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1 });
          resolve(data);
        } catch (error) {
          reject(new Error(`Excel解析失败: ${(error as Error).message}`));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  } else {
    throw new Error('不支持的文件格式，请上传CSV或Excel文件');
  }
}

// 创建导入记录
async function createImportRecord(entityType: string, data: Record<string, unknown>): Promise<{ id: string } | null> {
  try {
    switch (entityType) {
      case 'customers':
        return await db.createCustomer(data as Parameters<typeof db.createCustomer>[0]);
      case 'contacts':
        return await db.createContact(data as Parameters<typeof db.createContact>[0]);
      case 'leads':
        return await db.createLead(data as unknown as Parameters<typeof db.createLead>[0]);
      case 'opportunities':
        return await db.createOpportunity(data as Parameters<typeof db.createOpportunity>[0]);
      default:
        return null;
    }
  } catch (error) {
    console.error(`创建${entityType}失败:`, error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('type') as string;
    const mode = formData.get('mode') as string || 'preview';
    
    if (!file) {
      return NextResponse.json({ error: '请上传文件' }, { status: 400 });
    }
    
    if (!entityType || !ENTITY_FIELDS[entityType]) {
      return NextResponse.json(
        { error: '无效的数据类型，有效值: customers, contacts, leads, opportunities' },
        { status: 400 }
      );
    }
    
    const rawData = await parseFile(file);
    
    if (rawData.length < 2) {
      return NextResponse.json({ error: '文件数据不足' }, { status: 400 });
    }
    
    const headers = rawData[0].map(h => String(h).trim());
    const rows = rawData.slice(1);
    const validationResults: Array<{ rowIndex: number; valid: boolean; errors: Array<{ field: string; message: string }>; data: Record<string, unknown> }> = [];
    let validCount = 0;
    let invalidCount = 0;
    const allErrors: Array<{ row: number; field: string; message: string }> = [];
    
    for (let i = 0; i < rows.length; i++) {
      const rowData: Record<string, string> = {};
      headers.forEach((header, index) => {
        rowData[header] = rows[i][index] || '';
      });
      const result = validateRow(rowData, entityType, i + 1);
      validationResults.push({ ...result, rowIndex: i + 1 });
      if (result.valid) validCount++;
      else {
        invalidCount++;
        result.errors.forEach(err => allErrors.push({ row: i + 1, field: err.field, message: err.message }));
      }
    }
    
    if (mode === 'preview') {
      return NextResponse.json({
        success: true,
        mode: 'preview',
        summary: { total: rows.length, valid: validCount, invalid: invalidCount },
        headers,
        validRows: validationResults.filter(r => r.valid).slice(0, 10).map(r => ({ rowIndex: r.rowIndex, data: r.data })),
        invalidRows: validationResults.filter(r => !r.valid).slice(0, 10).map(r => ({ rowIndex: r.rowIndex, errors: r.errors })),
        errors: allErrors.slice(0, 50),
      });
    }
    
    if (mode === 'import') {
      const validRecords = validationResults.filter(r => r.valid);
      if (validRecords.length === 0) {
        return NextResponse.json({ success: false, error: '没有有效的数据可导入', summary: { total: rows.length, valid: 0, invalid: invalidCount } }, { status: 400 });
      }
      const imported: string[] = [];
      const failed: Array<{ row: number; error: string }> = [];
      for (const record of validRecords) {
        try {
          const result = await createImportRecord(entityType, record.data);
          if (result) imported.push(result.id);
        } catch (error) {
          failed.push({ row: record.rowIndex, error: (error as Error).message });
        }
      }
      return NextResponse.json({
        success: true,
        mode: 'import',
        summary: { total: validRecords.length, imported: imported.length, failed: failed.length, skipped: invalidCount },
        importedIds: imported.slice(0, 100),
        errors: failed,
      });
    }
    
    return NextResponse.json({ error: '无效的操作模式' }, { status: 400 });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: `导入失败: ${(error as Error).message}` }, { status: 500 });
  }
}
