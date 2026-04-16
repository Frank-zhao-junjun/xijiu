'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

// 阶段颜色配置
const STAGE_COLORS: Record<string, string> = {
  qualified: '#3b82f6',
  discovery: '#06b6d4',
  proposal: '#8b5cf6',
  negotiation: '#f59e0b',
  contract: '#10b981',
};

interface FunnelDataItem {
  stage: string;
  stageLabel: string;
  count: number;
  amount: number;
  conversionRate: number;
  color: string;
}

interface FunnelChartProps {
  data: FunnelDataItem[];
  viewMode: 'count' | 'amount';
}

const STAGE_LABELS: Record<string, string> = {
  qualified: '已Qualify',
  discovery: '需求调研',
  proposal: '方案报价',
  negotiation: '商务谈判',
  contract: '合同签署',
};

type FunnelTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: Record<string, unknown> }>;
};

const CustomTooltip = ({ active, payload }: FunnelTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as {
      stageLabel?: string;
      count?: number;
      amount?: number;
      conversionRate?: number;
    };
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white">{data.stageLabel}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          数量: <span className="font-medium">{data.count ?? 0}</span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          金额: <span className="font-medium">¥{(data.amount ?? 0).toLocaleString()}</span>
        </p>
        {(data.conversionRate ?? 0) > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            转化率: <span className="font-medium text-blue-600">{data.conversionRate}%</span>
          </p>
        )}
      </div>
    );
  }
  return null;
};

export function FunnelChart({ data, viewMode }: FunnelChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 20, right: 80, left: 80, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => 
              viewMode === 'amount' 
                ? `¥${(value / 10000).toFixed(0)}万` 
                : value
            }
            className="text-xs"
          />
          <YAxis 
            type="category" 
            dataKey="stageLabel" 
            width={80}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey={viewMode === 'amount' ? 'amount' : 'count'} radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList 
              dataKey={viewMode === 'amount' ? 'amount' : 'count'} 
              position="right"
              formatter={(value: number) => 
                viewMode === 'amount' 
                  ? `¥${value.toLocaleString()}` 
                  : value.toString()
              }
              className="text-xs fill-gray-600 dark:fill-gray-400"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// API 数据类型
interface ApiFunnelResponse {
  success: boolean;
  data: {
    stages: Array<{
      stage: string;
      stageLabel: string;
      count: number;
      amount: number;
      avgDays: number;
      conversionRate: number;
    }>;
    won: { count: number; amount: number };
    leads: number;
  };
  timestamp: string;
}

// 计算漏斗数据 - 使用 API
export function useFunnelData(timeRange: 'month' | 'quarter' | 'year' | 'all') {
  const [funnelData, setFunnelData] = useState<FunnelDataItem[]>([]);
  const [wonOpps, setWonOpps] = useState({ count: 0, amount: 0, label: '已成交' });
  const [leadCount, setLeadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/reports?type=funnel&timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('获取漏斗数据失败');
        }
        const result: ApiFunnelResponse = await response.json();
        
        if (result.success) {
          // 转换数据格式
          const transformedData: FunnelDataItem[] = result.data.stages.map(stage => ({
            stage: stage.stage,
            stageLabel: stage.stageLabel || STAGE_LABELS[stage.stage] || stage.stage,
            count: stage.count,
            amount: stage.amount,
            conversionRate: stage.conversionRate,
            color: STAGE_COLORS[stage.stage] || '#8884d8',
          }));
          
          setFunnelData(transformedData);
          setWonOpps({
            count: result.data.won.count,
            amount: result.data.won.amount,
            label: '已成交',
          });
          setLeadCount(result.data.leads);
        } else {
          throw new Error(result.data ? '获取数据失败' : '未知错误');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [timeRange]);

  return {
    funnelData,
    wonOpps,
    leadCount,
    loading,
    error,
  };
}
