'use client';

import { useState, useEffect, useMemo } from 'react';
import type { SalesOpportunity } from '@/lib/crm-types';
import { 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart
} from 'recharts';

// API 数据类型
interface ForecastItem {
  id: string;
  title: string;
  customerName: string;
  value: number;
  stage: string;
  probability: number;
  expectedValue: number;
  expectedCloseDate: string;
}

interface ForecastData {
  opportunities: ForecastItem[];
  summary: {
    totalPipeline: number;
    totalExpected: number;
    opportunityCount: number;
  };
}

interface ForecastPoint {
  month: string;
  optimistic: number;
  expected: number;
  conservative: number;
  actual?: number;
}

interface ForecastChartProps {
  data: ForecastPoint[];
}

type ForecastTooltipEntry = { name?: string; value?: number; color?: string };

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ForecastTooltipEntry[];
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span className="font-medium">¥{(entry.value ?? 0).toLocaleString()}</span>
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export function ForecastChart({ data }: ForecastChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <defs>
            <linearGradient id="optimisticGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="conservativeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="month" className="text-xs" />
          <YAxis 
            tickFormatter={(value) => `¥${(value / 10000).toFixed(0)}万`}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="optimistic" 
            name="乐观预测" 
            stroke="#10b981" 
            fill="url(#optimisticGradient)" 
            strokeDasharray="5 5"
          />
          <Area 
            type="monotone" 
            dataKey="conservative" 
            name="保守预测" 
            stroke="#f59e0b" 
            fill="url(#conservativeGradient)" 
            strokeDasharray="3 3"
          />
          <Line 
            type="monotone" 
            dataKey="expected" 
            name="预期预测" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ r: 4, fill: '#3b82f6' }}
          />
          {data.some(d => d.actual !== undefined) && (
            <Line 
              type="monotone" 
              dataKey="actual" 
              name="实际收入" 
              stroke="#8b5cf6" 
              strokeWidth={2}
              dot={{ r: 4, fill: '#8b5cf6' }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// API 响应类型
interface ApiForecastResponse {
  success: boolean;
  data: ForecastData;
  timestamp: string;
}

// 计算收入预测数据 - 使用 API
export function useForecastApiData(opportunitiesOrTimeRange: SalesOpportunity[] | string, period?: string) {
  const [, setForecastData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Compute forecast points from opportunities
  const computedData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    let months = 3;
    if (period === 'half') months = 6;
    if (period === 'year') months = 12;

    const points: ForecastPoint[] = [];
    let totalOptimistic = 0;
    let totalExpected = 0;
    let totalConservative = 0;

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(currentYear, currentMonth + i, 1);
      const monthLabel = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;

      // Filter opportunities expected to close in this month
      const monthOpps = Array.isArray(opportunitiesOrTimeRange)
        ? opportunitiesOrTimeRange.filter((o) => {
            const closeDate = new Date(o.expectedCloseDate || o.createdAt);
            return closeDate.getFullYear() === monthDate.getFullYear() && closeDate.getMonth() === monthDate.getMonth();
          })
        : [];

      const optimistic = monthOpps.reduce((sum, o) => sum + (o.value || 0), 0);
      const expected = monthOpps.reduce((sum, o) => sum + ((o.value || 0) * (o.probability || 50)) / 100, 0);
      const conservative = monthOpps.reduce(
        (sum, o) => sum + ((o.value || 0) * Math.min(o.probability || 50, 30)) / 100,
        0
      );

      totalOptimistic += optimistic;
      totalExpected += expected;
      totalConservative += conservative;

      points.push({
        month: monthLabel,
        optimistic: Math.round(optimistic),
        expected: Math.round(expected),
        conservative: Math.round(conservative),
      });
    }

    return {
      forecastData: points,
      totals: {
        optimistic: Math.round(totalOptimistic),
        expected: Math.round(totalExpected),
        conservative: Math.round(totalConservative),
      },
    };
  }, [opportunitiesOrTimeRange, period]);

  // Also fetch from API as a secondary source
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const timeRange = typeof opportunitiesOrTimeRange === 'string' ? opportunitiesOrTimeRange : 'all';
        const response = await fetch(`/api/reports?type=forecast&timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('获取预测数据失败');
        }
        const result: ApiForecastResponse = await response.json();
        
        if (result.success) {
          setForecastData(result.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [opportunitiesOrTimeRange]);

  // Return computed data for chart rendering
  return {
    forecastData: computedData.forecastData,
    totals: computedData.totals,
    loading,
    error,
  };
}

// 根据机会列表生成预测图表数据（用于时间线图表）
export function useForecastTimeline(opportunities: ForecastItem[], period: 'quarter' | 'half' | 'year') {
  const [chartData, setChartData] = useState<ForecastPoint[]>([]);
  
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 确定预测月份数
    let months = 3; // 默认季度
    if (period === 'half') months = 6;
    if (period === 'year') months = 12;
    
    // 计算各月预测
    const forecastData: ForecastPoint[] = [];
    
    for (let i = 0; i < months; i++) {
      const monthDate = new Date(currentYear, currentMonth + i, 1);
      const monthName = `${monthDate.getMonth() + 1}月`;
      
      // 计算该月到期的商机
      const dueOpps = opportunities.filter(opp => {
        const dueDate = new Date(opp.expectedCloseDate);
        return dueDate.getFullYear() === monthDate.getFullYear() && 
               dueDate.getMonth() === monthDate.getMonth();
      });
      
      // 计算预期金额
      const expectedAmount = dueOpps.reduce((sum, opp) => sum + opp.expectedValue, 0);
      
      // 乐观：所有商机都成交
      const optimisticAmount = dueOpps.reduce((sum, opp) => sum + opp.value, 0);
      
      // 保守：概率打6折
      const conservativeAmount = dueOpps.reduce((sum, opp) => sum + opp.expectedValue * 0.6, 0);
      
      forecastData.push({
        month: monthName,
        optimistic: optimisticAmount,
        expected: expectedAmount,
        conservative: conservativeAmount,
      });
    }
    
    setChartData(forecastData);
  }, [opportunities, period]);

  return chartData;
}

export { useForecastApiData as useForecastData };
