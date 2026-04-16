// Reports API 路由 - 报表数据分析接口

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as db from '@/lib/crm-database';

// 销售漏斗阶段配置
const STAGE_PROBABILITIES: Record<string, number> = {
  qualified: 20,
  discovery: 40,
  proposal: 60,
  negotiation: 80,
  contract: 90,
};

// ============ GET: 获取报表数据 ============

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'stats';
    const timeRange = (searchParams.get('timeRange') || 'all') as 'month' | 'quarter' | 'year' | 'all';
    
    const client = getSupabaseClient();
    
    switch (reportType) {
      case 'stats': {
        // 报表统计概览
        const stats = await db.getReportStats(timeRange);
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });
      }
        
      case 'funnel': {
        // 销售漏斗数据
        const funnelData = await db.getFunnelData(timeRange);
        
        // 计算已成交统计
        const { data: wonOpps } = await client
          .from('opportunities')
          .select('value')
          .eq('stage', 'closed_won');
        
        const wonCount = wonOpps?.length || 0;
        const wonAmount = wonOpps?.reduce((sum, opp) => sum + Number(opp.value), 0) || 0;
        
        // 获取线索数
        const { data: leads } = await client
          .from('leads')
          .select('count', { count: 'exact' });
        
        return NextResponse.json({
          success: true,
          data: {
            stages: funnelData,
            won: { count: wonCount, amount: wonAmount },
            leads: (leads as Record<string, unknown>[])?.length || 0,
          },
          timestamp: new Date().toISOString(),
        });
      }
        
      case 'ranking': {
        // 团队业绩排行
        const rankingData = await db.getTeamRankingData(timeRange);
        return NextResponse.json({
          success: true,
          data: rankingData,
          timestamp: new Date().toISOString(),
        });
      }
        
      case 'forecast': {
        // 收入预测数据
        const opportunities = await db.getAllOpportunities();
        const activeOpps = opportunities.filter(opp => !['closed_won', 'closed_lost'].includes(opp.stage));
        
        // 计算预期收入
        const forecastData = activeOpps.map(opp => ({
          id: opp.id,
          title: opp.title,
          customerName: opp.customer_name,
          value: Number(opp.value),
          stage: opp.stage,
          probability: STAGE_PROBABILITIES[opp.stage] || 0,
          expectedValue: Number(opp.value) * (STAGE_PROBABILITIES[opp.stage] || 0) / 100,
          expectedCloseDate: opp.expected_close_date,
        }));
        
        const totalPipeline = activeOpps.reduce((sum, opp) => sum + Number(opp.value), 0);
        const totalExpected = forecastData.reduce((sum, item) => sum + item.expectedValue, 0);
        
        return NextResponse.json({
          success: true,
          data: {
            opportunities: forecastData,
            summary: {
              totalPipeline,
              totalExpected,
              opportunityCount: activeOpps.length,
            },
          },
          timestamp: new Date().toISOString(),
        });
      }
        
      case 'conversion': {
        // 阶段转化分析
        const conversionData = await db.getConversionData(timeRange);
        return NextResponse.json({
          success: true,
          data: conversionData,
          timestamp: new Date().toISOString(),
        });
      }
        
      default:
        return NextResponse.json(
          { success: false, error: '未知的报表类型' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Reports API error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    );
  }
}
