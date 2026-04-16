/**
 * 增强的导出API
 * 支持CSV和Excel格式导出
 */

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as db from '@/lib/crm-database';

// 字段配置
const ENTITY_COLUMNS: Record<string, { headers: string[]; keys: string[]; labels: Record<string, Record<string, string>> }> = {
  customers: {
    headers: ['ID', '姓名', '邮箱', '电话', '公司', '状态', '行业', '网站', '地址', '备注', '创建时间', '更新时间'],
    keys: ['id', 'name', 'email', 'phone', 'company', 'status', 'industry', 'website', 'address', 'notes', 'created_at', 'updated_at'],
    labels: { status: { active: '活跃', inactive: '非活跃', prospect: '潜在客户' } }
  },
  leads: {
    headers: ['ID', '标题', '来源', '客户名称', '联系人名称', '预估金额', '概率(%)', '状态', '备注', '创建时间', '更新时间'],
    keys: ['id', 'title', 'source', 'customer_name', 'contact_name', 'estimated_value', 'probability', 'status', 'notes', 'created_at', 'updated_at'],
    labels: {
      source: { referral: '转介绍', website: '网站', cold_call: '电话拓展', event: '活动', advertisement: '广告', other: '其他' },
      status: { new: '新线索', contacted: '已联系', qualified: '已筛选', disqualified: '已淘汰' }
    }
  },
  opportunities: {
    headers: ['ID', '标题', '客户名称', '联系人名称', '金额', '阶段', '概率(%)', '预计成交日期', '描述', '创建时间', '更新时间'],
    keys: ['id', 'title', 'customer_name', 'contact_name', 'value', 'stage', 'probability', 'expected_close_date', 'description', 'created_at', 'updated_at'],
    labels: {
      stage: { qualified: '筛选', discovery: '需求发现', proposal: '方案报价', negotiation: '商务谈判', contract: '合同签订', closed_won: '成交', closed_lost: '失败' }
    }
  },
  contacts: {
    headers: ['ID', '名', '姓', '邮箱', '电话', '职位', '客户名称', '是否主要联系人', '创建时间', '更新时间'],
    keys: ['id', 'first_name', 'last_name', 'email', 'phone', 'position', 'customer_name', 'is_primary', 'created_at', 'updated_at'],
    labels: { is_primary: { true: '是', false: '否' } }
  },
};

// 导出记录结构
interface ExportRecord {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  industry?: string;
  website?: string;
  address?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Leads
  title?: string;
  source?: string;
  customer_name?: string;
  contact_name?: string;
  estimated_value?: number;
  probability?: number;
  // Opportunities
  value?: number;
  stage?: string;
  expected_close_date?: string;
  description?: string;
  // Contacts
  first_name?: string;
  last_name?: string;
  position?: string;
  is_primary?: boolean;
}

// CSV转义
function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'boolean') return value ? '是' : '否';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// 格式化值
function formatValue(key: string, value: unknown, labels: Record<string, Record<string, string>>): string {
  if (value === null || value === undefined) return '';
  
  // 应用标签映射
  if (labels[key] && typeof value === 'string') {
    return labels[key][value] || value;
  }
  
  // 布尔值
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }
  
  // 数字格式化
  if (typeof value === 'number' && (key.includes('value') || key.includes('Value'))) {
    return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  
  // 日期格式化
  if (key.includes('date') || key.includes('Date') || key.includes('_at')) {
    if (typeof value === 'string') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('zh-CN');
        }
      } catch {
        return value;
      }
    }
  }
  
  return String(value);
}

// 获取数据
async function getEntityData(entityType: string): Promise<ExportRecord[]> {
  switch (entityType) {
    case 'customers':
      return await db.getAllCustomers() as unknown as ExportRecord[];
    case 'leads':
      return await db.getAllLeads() as unknown as ExportRecord[];
    case 'opportunities':
      return await db.getAllOpportunities() as unknown as ExportRecord[];
    case 'contacts':
      return await db.getAllContacts() as unknown as ExportRecord[];
    default:
      throw new Error('不支持的导出类型');
  }
}

// 生成CSV
function generateCSV(data: ExportRecord[], config: typeof ENTITY_COLUMNS[string]): string {
  const rows: string[][] = [config.headers];
  
  for (const record of data) {
    const row = config.keys.map(key => {
      const value = record[key as keyof ExportRecord];
      return escapeCSV(formatValue(key, value, config.labels));
    });
    rows.push(row);
  }
  
  return rows.map(row => row.join(',')).join('\n');
}

// 生成Excel
function generateExcel(data: ExportRecord[], config: typeof ENTITY_COLUMNS[string]): Uint8Array {
  const rows: (string | number | boolean | null)[][] = [config.headers];
  
  for (const record of data) {
    const row = config.keys.map(key => {
      const value = record[key as keyof ExportRecord];
      return formatValue(key, value, config.labels) as string | number | boolean | null;
    });
    rows.push(row);
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = config.headers.map(() => ({ wch: 15 }));
  
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '数据导出');
  
  return new Uint8Array(XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }));
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const entityType = searchParams.get('type') || 'customers';
    const format = searchParams.get('format') || 'csv';
    
    // 验证类型
    if (!ENTITY_COLUMNS[entityType]) {
      return NextResponse.json(
        { error: '不支持的导出类型，有效值: customers, leads, opportunities, contacts' },
        { status: 400 }
      );
    }
    
    // 验证格式
    if (!['csv', 'xlsx'].includes(format)) {
      return NextResponse.json(
        { error: '不支持的导出格式，有效值: csv, xlsx' },
        { status: 400 }
      );
    }
    
    // 获取数据
    const data = await getEntityData(entityType);
    
    if (data.length === 0) {
      return NextResponse.json(
        { error: '没有数据可导出' },
        { status: 404 }
      );
    }
    
    const config = ENTITY_COLUMNS[entityType];
    const now = new Date().toISOString().split('T')[0];
    const fileName = `${entityType}_${now}`;
    
    if (format === 'csv') {
      const csv = '\uFEFF' + generateCSV(data, config);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}.csv"`,
        },
      });
    } else {
      const excel = generateExcel(data, config);
      return new Response(excel as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}.xlsx"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: `导出失败: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
