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
  Legend
} from 'recharts';

interface TeamMember {
  memberId: string;
  memberName: string;
  wonAmount: number;
  wonCount: number;
  newOpportunities: number;
  pipelineAmount: number;
  conversionRate: number;
  avgDealSize: number;
}

interface RankingData {
  member: {
    id: string;
    name: string;
  };
  metrics: {
    wonAmount: number;
    wonCount: number;
    newOpps: number;
    pipelineAmount: number;
    conversionRate: number;
    avgDealSize: number;
    growth: number;
  };
}

interface TeamRankingChartProps {
  data: RankingData[];
  sortBy: 'wonAmount' | 'wonCount' | 'conversionRate' | 'newOpps';
}

const CHART_COLORS = {
  wonAmount: '#10b981',
  pipelineAmount: '#3b82f6',
};

type TeamRankingTooltipProps = {
  active?: boolean;
  payload?: Array<{ payload?: RankingData }>;
};

const CustomTooltip = ({ active, payload }: TeamRankingTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="font-semibold text-gray-900 dark:text-white">{data?.member?.name}</p>
        <div className="mt-2 space-y-1 text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            成交金额: <span className="font-medium text-green-600">¥{data?.metrics?.wonAmount.toLocaleString()}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            成交数量: <span className="font-medium">{data?.metrics?.wonCount}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            新增商机: <span className="font-medium">{data?.metrics?.newOpps}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            转化率: <span className="font-medium text-blue-600">{data?.metrics?.conversionRate.toFixed(1)}%</span>
          </p>
        </div>
      </div>
    );
  }
  return null;
};

export function TeamRankingChart({ data, sortBy }: TeamRankingChartProps) {
  const chartData = [...data]
    .sort((a, b) => {
      switch (sortBy) {
        case 'wonAmount':
          return b.metrics.wonAmount - a.metrics.wonAmount;
        case 'wonCount':
          return b.metrics.wonCount - a.metrics.wonCount;
        case 'conversionRate':
          return b.metrics.conversionRate - a.metrics.conversionRate;
        case 'newOpps':
          return b.metrics.newOpps - a.metrics.newOpps;
        default:
          return 0;
      }
    })
    .slice(0, 10);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis 
            dataKey="member.name" 
            angle={-45} 
            textAnchor="end" 
            height={60}
            className="text-xs"
          />
          <YAxis 
            yAxisId="left"
            orientation="left"
            stroke="#10b981"
            className="text-xs"
          />
          <YAxis 
            yAxisId="right"
            orientation="right"
            stroke="#3b82f6"
            className="text-xs"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar yAxisId="left" dataKey="metrics.wonAmount" name="成交金额" fill={CHART_COLORS.wonAmount} radius={[4, 4, 0, 0]} />
          <Bar yAxisId="right" dataKey="metrics.newOpps" name="新增商机" fill={CHART_COLORS.pipelineAmount} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// API 响应类型
interface ApiRankingResponse {
  success: boolean;
  data: TeamMember[];
  timestamp: string;
}

// 计算团队排名数据 - 使用 API
export function useTeamRankingApi(timeRange: 'month' | 'quarter' | 'year' | 'all') {
  const [rankingData, setRankingData] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/reports?type=ranking&timeRange=${timeRange}`);
        if (!response.ok) {
          throw new Error('获取排行数据失败');
        }
        const result: ApiRankingResponse = await response.json();
        
        if (result.success) {
          // 转换数据格式
          const transformedData: RankingData[] = result.data.map(member => ({
            member: {
              id: member.memberId,
              name: member.memberName,
            },
            metrics: {
              wonAmount: member.wonAmount,
              wonCount: member.wonCount,
              newOpps: member.newOpportunities,
              pipelineAmount: member.pipelineAmount,
              conversionRate: member.conversionRate,
              avgDealSize: member.avgDealSize,
              growth: 0, // API 未返回增长率
            },
          }));
          
          setRankingData(transformedData);
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

  return {
    rankingData,
    loading,
    error,
  };
}
