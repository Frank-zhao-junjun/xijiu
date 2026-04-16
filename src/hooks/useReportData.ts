'use client';

import { useState, useEffect, useCallback } from 'react';

// 报表统计数据类型
export interface ReportStats {
  totalPipeline: number;
  totalWon: number;
  activeOpportunities: number;
  wonOpportunities: number;
  totalLeads: number;
  totalCustomers: number;
  conversionRate: number;
  avgDealSize: number;
  periodStart: string;
  periodEnd: string;
}

// 漏斗数据项类型
export interface FunnelStage {
  stage: string;
  stageLabel: string;
  count: number;
  amount: number;
  avgDays: number;
  conversionRate: number;
}

// 团队排行数据项类型
export interface TeamRankingItem {
  memberId: string;
  memberName: string;
  wonAmount: number;
  wonCount: number;
  newOpportunities: number;
  pipelineAmount: number;
  conversionRate: number;
  avgDealSize: number;
}

// 预测数据项类型
export interface ForecastItem {
  id: string;
  title: string;
  customerName: string;
  value: number;
  stage: string;
  probability: number;
  expectedValue: number;
  expectedCloseDate: string;
}

export interface ForecastData {
  opportunities: ForecastItem[];
  summary: {
    totalPipeline: number;
    totalExpected: number;
    opportunityCount: number;
  };
}

// 转化数据项类型
export interface ConversionItem {
  fromStage: string;
  toStage: string;
  stageLabel: string;
  fromCount: number;
  toCount: number;
  conversionRate: number;
  isBottleneck: boolean;
}

// API 响应类型
interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  error?: string;
}

// 时间范围类型
export type TimeRange = 'month' | 'quarter' | 'year' | 'all';

// 获取报表统计
export function useReportStats(timeRange: TimeRange = 'all') {
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports?type=stats&timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }
      const result: ApiResponse<ReportStats> = await response.json();
      if (result.success) {
        setStats(result.data);
      } else {
        throw new Error(result.error || '获取统计数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
}

// 获取漏斗数据
export function useFunnelApiData(timeRange: TimeRange = 'all') {
  const [data, setData] = useState<{
    stages: FunnelStage[];
    won: { count: number; amount: number };
    leads: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports?type=funnel&timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('获取漏斗数据失败');
      }
      const result: ApiResponse<typeof data> = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || '获取漏斗数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData };
}

// 获取团队排行数据
export function useTeamRankingData(timeRange: TimeRange = 'all') {
  const [ranking, setRanking] = useState<TeamRankingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRanking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports?type=ranking&timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('获取排行数据失败');
      }
      const result: ApiResponse<TeamRankingItem[]> = await response.json();
      if (result.success) {
        setRanking(result.data);
      } else {
        throw new Error(result.error || '获取排行数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  return { ranking, loading, error, refresh: fetchRanking };
}

// 获取预测数据
export function useForecastData(timeRange: TimeRange = 'all') {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports?type=forecast&timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('获取预测数据失败');
      }
      const result: ApiResponse<ForecastData> = await response.json();
      if (result.success) {
        setForecast(result.data);
      } else {
        throw new Error(result.error || '获取预测数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchForecast();
  }, [fetchForecast]);

  return { forecast, loading, error, refresh: fetchForecast };
}

// 获取转化数据
export function useConversionData(timeRange: TimeRange = 'all') {
  const [conversion, setConversion] = useState<ConversionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/reports?type=conversion&timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error('获取转化数据失败');
      }
      const result: ApiResponse<ConversionItem[]> = await response.json();
      if (result.success) {
        setConversion(result.data);
      } else {
        throw new Error(result.error || '获取转化数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchConversion();
  }, [fetchConversion]);

  return { conversion, loading, error, refresh: fetchConversion };
}
