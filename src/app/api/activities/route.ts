// Activities API Route - 活动追踪 API

import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/crm-database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // 解析筛选参数
    const filters: db.ActivityFilters = {
      entity_type: searchParams.get('entity_type') || undefined,
      entity_id: searchParams.get('entity_id') || undefined,
      type: searchParams.get('type') || undefined,
      start_date: searchParams.get('start_date') || undefined,
      end_date: searchParams.get('end_date') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    };

    // 验证分页参数
    if (filters.page! < 1) filters.page = 1;
    if (filters.pageSize! < 1) filters.pageSize = 20;
    if (filters.pageSize! > 100) filters.pageSize = 100;

    const result = await db.getActivities(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取活动列表失败:', error);
    return NextResponse.json(
      { error: '获取活动列表失败' },
      { status: 500 }
    );
  }
}
