'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SalesOpportunity, OpportunityStage } from '@/lib/crm-types';

// Types
export interface ConversionDataItem {
  stage: OpportunityStage;
  stageLabel: string;
  enteredCount: number;
  exitedCount: number;
  conversionRate: number;
  avgDuration: number;
  isBottleneck: boolean;
  prevConversionRate?: number;
}

export interface BottleneckStage {
  stage: OpportunityStage;
  stageLabel: string;
  conversionRate: number;
  avgDuration: number;
}

// Conversion data hook
export function useConversionData(
  opportunities: SalesOpportunity[],
  _timeRange: string = 'all',
  _compareWith?: string
) {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const conversionData = useMemo<ConversionDataItem[]>(() => {
    const stageOrder: OpportunityStage[] = ['qualified', 'proposal', 'negotiation', 'closed_won'];
    const stageLabels: Record<OpportunityStage, string> = {
      qualified: '机会确认',
      discovery: '需求确认',
      proposal: '提案',
      negotiation: '谈判',
      contract: '合同签署',
      closed_won: '成交',
      closed_lost: '失败',
    };

    return stageOrder.map((stage, idx) => {
      const enteredCount = opportunities.filter(o => o.stage === stage || (idx < stageOrder.length - 1 && o.stage === stageOrder[idx + 1])).length;
      const stageOpps = opportunities.filter(o => o.stage === stage);
      const nextStageOpps = idx < stageOrder.length - 1
        ? opportunities.filter(o => o.stage === stageOrder[idx + 1])
        : opportunities.filter(o => o.stage === 'closed_won');
      const conversionRate = enteredCount > 0 ? Math.round((nextStageOpps.length / enteredCount) * 100) : 0;

      return {
        stage,
        stageLabel: stageLabels[stage],
        enteredCount: stageOpps.length,
        exitedCount: nextStageOpps.length,
        conversionRate,
        avgDuration: 0,
        isBottleneck: conversionRate < 40 && stageOpps.length > 0,
      };
    });
  }, [opportunities]);

  const bottleneckStages = useMemo<BottleneckStage[]>(() => {
    return conversionData.filter(d => d.isBottleneck).map(d => ({
      stage: d.stage,
      stageLabel: d.stageLabel,
      conversionRate: d.conversionRate,
      avgDuration: d.avgDuration,
    }));
  }, [conversionData]);

  const overallConversion = useMemo(() => {
    const total = opportunities.length;
    const won = opportunities.filter(o => o.stage === 'closed_won').length;
    return total > 0 ? Math.round((won / total) * 100) : 0;
  }, [opportunities]);

  return { conversionData, bottleneckStages, overallConversion, loading, error };
}

// Forecast data hook
export function useForecastData(
  opportunities: SalesOpportunity[],
  _timeRange: string = 'all'
) {
  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  const forecastData = useMemo(() => {
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
    const wonOpps = opportunities.filter(o => o.stage === 'closed_won');
    const pipelineOpps = opportunities.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost');

    return months.map((month, idx) => ({
      month,
      actual: wonOpps.reduce((sum, o) => sum + (idx === new Date(o.expectedCloseDate || o.createdAt).getMonth() ? o.value : 0), 0),
      forecast: pipelineOpps.reduce((sum, o) => sum + (idx === new Date(o.expectedCloseDate || o.createdAt).getMonth() ? o.value * (o.probability / 100) : 0), 0),
      pipeline: pipelineOpps.reduce((sum, o) => sum + (idx === new Date(o.expectedCloseDate || o.createdAt).getMonth() ? o.value : 0), 0),
    }));
  }, [opportunities]);

  return { forecastData, loading, error };
}

// Team ranking hook
export function useTeamRanking() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/reports?type=team-ranking')
      .then(r => r.json())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  return { data, loading, error };
}
