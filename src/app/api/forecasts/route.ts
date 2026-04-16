// 销售预测 API

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  generateForecastReport,
  generateQuarterlyForecast,
  generateAccuracyReport,
  generateForecastVsActual,
  STAGE_DEFAULT_PROBABILITIES,
  type Opportunity,
} from '@/lib/sales-forecast';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'monthly';
    const months = parseInt(searchParams.get('months') || '6', 10);
    const includeActual = searchParams.get('includeActual') === 'true';

    const client = getSupabaseClient();

    // 计算日期范围
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);
    const startDate = new Date();

    // 获取活跃商机（排除已关闭）
    const { data: opportunities, error: oppError } = await client
      .from('opportunities')
      .select('*')
      .not('stage', 'eq', 'closed_won')
      .not('stage', 'eq', 'closed_lost')
      .or(`expected_close_date.gte.${startDate.toISOString()},expected_close_date.is.null`);

    if (oppError) {
      return NextResponse.json({ error: '获取商机失败' }, { status: 500 });
    }

    const typedOpportunities: Opportunity[] = opportunities || [];

    // 生成月度预测
    const monthlyForecast = generateForecastReport(typedOpportunities, startDate, endDate);

    const result: Record<string, unknown> = {
      monthly: monthlyForecast,
      summary: {
        totalForecast: monthlyForecast.reduce((sum, f) => sum + f.totalWeightedValue, 0),
        totalPipeline: monthlyForecast.reduce((sum, f) => sum + f.totalValue, 0),
        totalOpportunities: monthlyForecast.reduce((sum, f) => sum + f.opportunityCount, 0),
      },
      stageProbabilities: STAGE_DEFAULT_PROBABILITIES,
    };

    // 季度汇总
    if (type === 'quarterly' || type === 'all') {
      result.quarterly = generateQuarterlyForecast(monthlyForecast);
    }

    // 准确度追踪（如果有历史数据）
    if (includeActual) {
      const { data: closedDeals } = await client
        .from('opportunities')
        .select('expected_close_date, value, stage')
        .eq('stage', 'closed_won');

      const actualResults = new Map<string, number>();
      if (closedDeals) {
        for (const deal of closedDeals) {
          if (deal.expected_close_date) {
            const date = new Date(deal.expected_close_date);
            const period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const value = parseFloat(String(deal.value)) || 0;
            actualResults.set(period, (actualResults.get(period) || 0) + value);
          }
        }
      }

      result.accuracy = generateAccuracyReport(monthlyForecast, actualResults);
      result.vsActual = generateForecastVsActual(monthlyForecast, actualResults);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Forecast API error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
