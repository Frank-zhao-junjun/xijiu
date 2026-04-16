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
  ReferenceLine
} from 'recharts';

interface ConversionDataItem {
  fromStage: string;
  toStage: string;
  stageLabel: string;
  fromCount: number;
  toCount: number;
  conversionRate: number;
  avgDays: number;
  isBottleneck: boolean;
}

interface ConversionChartProps {
  data: ConversionDataItem[];
}

const STAGE_LABELS: Record<string, string> = {
  lead: '线索',
  qualified: '已Qualify',
  discovery: '需求调研',
  proposal: '方案报价',
  negotiation: '商务谈判',
  contract: '合同签署',
  closed_won: '成交',
};

type ConversionTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: Record<string, unknown> }>;
};

const CustomTooltip = ({ active, payload }: ConversionTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as {
      stageLabel?: string;
      fromCount?: number;
      toCount?: number;
      conversionRate?: number;
      isBottleneck?: boolean;
    };
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white">{data.stageLabel}</p>
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            进入数量: <span className="font-medium">{data.fromCount ?? 0}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            流出数量: <span className="font-medium">{data.toCount ?? 0}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            转化率: <span className="font-medium" style={{ color: data.isBottleneck ? '#ef4444' : '#3b82f6' }}>
              {(data.conversionRate ?? 0).toFixed(1)}%
            </span>
          </p>
          {data.isBottleneck && (
            <p className="text-red-600 font-medium mt-1">
              ⚠️ 转化瓶颈阶段
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function ConversionChart({ data }: ConversionChartProps) {
  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis dataKey="stageLabel" className="text-xs" />
          <YAxis 
            tickFormatter={(value) => `${value}%`}
            domain={[0, 100]}
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label="平均线" />
          <Bar dataKey="conversionRate" name="转化率" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.isBottleneck ? '#ef4444' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// API 响应类型
interface ApiConversionResponse {
  success: boolean;
  data: ConversionDataItem[];
  timestamp: string;
}

// 获取转化数据 - 使用 API
export function useConversionApiData(timeRange: 'month' | 'quarter' | 'year' | 'all') {
  const [conversionData, setConversionData] = useState<ConversionDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/reports?type=conversion&timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('获取转化数据失败');
        }
        const result: ApiConversionResponse = await response.json();
        
        if (result.success) {
          // 转换标签
          const transformedData = result.data.map(item => ({
            ...item,
            stageLabel: item.stageLabel || `${STAGE_LABELS[item.fromStage]}→${STAGE_LABELS[item.toStage] || item.toStage}`,
          }));
          setConversionData(transformedData);
        } else {
          throw new Error('获取数据失败');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [timeRange]);

  // 计算瓶颈阶段
  const bottleneckStages = conversionData
    .filter(d => d.isBottleneck)
    .map(d => ({
      stage: d.fromStage,
      stageLabel: d.stageLabel,
      conversionRate: d.conversionRate,
      avgDuration: 0,
    }));

  // 计算总体转化率
  const overallConversion = conversionData.length > 0
    ? Math.round(conversionData.reduce((sum, d) => sum + d.conversionRate, 0) / conversionData.length)
    : 0;

  return {
    conversionData,
    bottleneckStages,
    overallConversion,
    loading,
    error,
  };
}

export { useConversionApiData as useConversionData };
