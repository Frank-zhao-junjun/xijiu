'use client';

import { OPPORTUNITY_STAGE_CONFIG, type OpportunityStage } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import { TrendingUp, DollarSign, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StageData {
  stage: OpportunityStage;
  count: number;
  value: number;
}

interface StageConversionChartProps {
  data: StageData[];
  className?: string;
}

/**
 * 销售漏斗阶段转化率图表
 * 展示每个阶段的商机数量和相比上一阶段的转化率
 */
export function StageConversionChart({ data, className }: StageConversionChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // 过滤掉closed_won和closed_lost（这些是结束状态）
  const pipelineData = data.filter(d => 
    d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  );
  
  const wonData = data.find(d => d.stage === 'closed_won');

  // 计算转化率
  const conversionRates = pipelineData.map((item, index) => {
    if (index === 0) return 100;
    const prevCount = pipelineData[index - 1]?.count || 0;
    if (prevCount === 0) return 0;
    return Math.round((item.count / prevCount) * 100);
  });

  // 计算平均转化率
  const validRates = conversionRates.slice(1).filter(r => r > 0);
  const avgConversionRate = validRates.length > 0 
    ? Math.round(validRates.reduce((a, b) => a + b, 0) / validRates.length)
    : 0;

  const maxCount = Math.max(...pipelineData.map(d => d.count), 1);

  return (
    <div className={cn('space-y-4', className)}>
      {/* 标题和统计 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">阶段转化率</span>
        </div>
        <div className="text-xs text-muted-foreground">
          平均转化率: <span className="font-semibold text-primary">{avgConversionRate}%</span>
        </div>
      </div>

      {/* 柱状图 */}
      <div className="flex items-end justify-between gap-1 h-32 px-2">
        {pipelineData.map((item, index) => {
          const config = OPPORTUNITY_STAGE_CONFIG[item.stage];
          if (!config) return null;
          
          const heightPercent = (item.count / maxCount) * 100;
          const conversionRate = conversionRates[index];
          const prevRate = index > 0 ? conversionRates[index - 1] : 100;
          const rateChange = conversionRate - prevRate;

          return (
            <div key={item.stage} className="flex flex-col items-center flex-1 group">
              {/* 转化率变化指示 */}
              <div className="text-xs mb-1 flex items-center gap-0.5">
                {index > 0 && (
                  <>
                    {rateChange >= 0 ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                    <span className={rateChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {Math.abs(rateChange)}%
                    </span>
                  </>
                )}
              </div>
              
              {/* 柱状条 */}
              <div className="relative w-full flex justify-center">
                <div
                  className={cn(
                    'w-8 rounded-t-md transition-all duration-300 flex items-end justify-center pb-1',
                    'bg-gradient-to-t',
                    config.gradient,
                    'group-hover:opacity-80 group-hover:scale-105'
                  )}
                  style={{ height: `${Math.max(heightPercent, 8)}%` }}
                >
                  <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.count}
                  </span>
                </div>
              </div>
              
              {/* 阶段标签 */}
              <div className="mt-2 text-center">
                <span className={cn('text-xs font-medium', config.color)}>
                  {config.label.replace('商机', '').replace('阶段', '')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 成交统计 */}
      {wonData && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t">
          <Target className="h-4 w-4 text-green-500" />
          <span className="text-xs text-muted-foreground">
            成交: <span className="font-semibold text-green-600 dark:text-green-400">{wonData.count}</span> 单
          </span>
          <span className="text-muted-foreground/50">|</span>
          <span className="text-xs text-muted-foreground">
            金额: <span className="font-semibold text-green-600 dark:text-green-400">¥{(wonData.value / 10000).toFixed(1)}万</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 商机金额分布饼图（简化版）
 */
export function StageValueDistribution({ data, className }: StageValueDistributionProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const pipelineData = data.filter(d => 
    d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  );
  
  const totalValue = pipelineData.reduce((sum, d) => sum + d.value, 0);

  if (totalValue === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-sm text-muted-foreground', className)}>
        暂无管道金额数据
      </div>
    );
  }

  // 计算各阶段占比
  const stageValues = pipelineData.map(item => ({
    ...item,
    percentage: Math.round((item.value / totalValue) * 100),
  }));

  // 渐变色定义
  const gradients = [
    'from-blue-500 to-cyan-500',
    'from-sky-400 to-blue-500',
    'from-purple-400 to-pink-500',
    'from-orange-400 to-amber-500',
    'from-teal-400 to-emerald-500',
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">管道金额分布</span>
      </div>

      {/* 金额统计 */}
      <div className="text-center py-2">
        <p className="text-lg font-bold">¥{(totalValue / 10000).toFixed(1)}万</p>
        <p className="text-xs text-muted-foreground">总管道金额</p>
      </div>

      {/* 分布条 */}
      <div className="space-y-2">
        {stageValues.map((item, index) => {
          const config = OPPORTUNITY_STAGE_CONFIG[item.stage];
          if (!config) return null;

          return (
            <div key={item.stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={config.color}>{config.label}</span>
                <span className="text-muted-foreground">
                  ¥{(item.value / 10000).toFixed(1)}万 ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full bg-gradient-to-r transition-all', gradients[index % gradients.length])}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StageValueDistributionProps {
  data: StageData[];
  className?: string;
}

/**
 * 赢单预测组件
 * 基于各阶段商机概率计算预期收入
 */
export function WinProbabilityForecast({ data, className }: WinProbabilityForecastProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const pipelineData = data.filter(d => 
    d.stage !== 'closed_won' && d.stage !== 'closed_lost'
  );

  // 阶段概率配置
  const stageProbabilities: Record<OpportunityStage, number> = {
    qualified: 20,
    discovery: 30,
    proposal: 45,
    negotiation: 65,
    contract: 85,
    closed_won: 100,
    closed_lost: 0,
  };

  // 计算加权预测金额
  let weightedForecast = 0;
  pipelineData.forEach(item => {
    const probability = stageProbabilities[item.stage] || 0;
    weightedForecast += item.value * (probability / 100);
  });

  // 已成交金额
  const wonValue = data.find(d => d.stage === 'closed_won')?.value || 0;

  // 总预期（已成交 + 加权预测）
  const totalExpected = wonValue + weightedForecast;

  // 计算乐观/悲观预测
  const optimisticForecast = pipelineData.reduce((sum, item) => sum + item.value, 0);
  const conservativeForecast = weightedForecast;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 标题 */}
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">赢单预测</span>
      </div>

      {/* 核心预测数字 */}
      <div className="text-center py-3 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg">
        <p className="text-2xl font-bold gradient-text">
          ¥{(totalExpected / 10000).toFixed(1)}万
        </p>
        <p className="text-xs text-muted-foreground mt-1">预期总收入</p>
      </div>

      {/* 预测区间 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 rounded-lg bg-green-500/5 border border-green-500/20">
          <p className="text-xs text-green-600 dark:text-green-400 mb-1">乐观</p>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            ¥{(optimisticForecast / 10000).toFixed(1)}万
          </p>
        </div>
        <div className="p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">保守</p>
          <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
            ¥{(conservativeForecast / 10000).toFixed(1)}万
          </p>
        </div>
      </div>

      {/* 已成交 */}
      <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-xs text-muted-foreground">已成交</span>
        </div>
        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          ¥{(wonValue / 10000).toFixed(1)}万
        </span>
      </div>

      {/* 说明 */}
      <p className="text-xs text-muted-foreground text-center">
        基于各阶段赢单概率加权计算
      </p>
    </div>
  );
}

interface WinProbabilityForecastProps {
  data: StageData[];
  className?: string;
}
