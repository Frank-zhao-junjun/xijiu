'use client';

import { OPPORTUNITY_STAGE_CONFIG, type OpportunityStage } from '@/lib/crm-types';
import { cn } from '@/lib/utils';

interface FunnelStage {
  stage: OpportunityStage;
  count: number;
  value: number;
}

interface SalesFunnelProps {
  data: FunnelStage[];
  className?: string;
}

export function SalesFunnel({ data, className }: SalesFunnelProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn('text-center py-8 text-muted-foreground', className)}>
        <p className="text-sm">暂无销售漏斗数据</p>
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  const totalValue = data.reduce((sum, d) => sum + d.value, 0);

  // 计算转化率
  const conversionRates = data.map((item, index) => {
    if (index === 0) return 100;
    const prevCount = data[index - 1]?.count || 0;
    if (prevCount === 0) return 0;
    return Math.round((item.count / prevCount) * 100);
  });

  // 总转化率 (从第一阶段到成交)
  const firstCount = data[0]?.count || 0;
  const wonCount = data.find(d => d.stage === 'closed_won')?.count || 0;
  const overallConversion = firstCount > 0 ? Math.round((wonCount / firstCount) * 100) : 0;

  return (
    <div className={cn('space-y-4', className)}>
      {/* 漏斗可视化 */}
      <div className="space-y-2">
        {data.map((item, index) => {
          const config = OPPORTUNITY_STAGE_CONFIG[item.stage];
          if (!config) return null;
          const widthPercent = Math.max((item.count / maxCount) * 100, 15);
          const conversionRate = conversionRates[index];

          return (
            <div key={item.stage} className="group">
              <div className="flex items-center gap-3">
                {/* 阶段标签 */}
                <div className="w-16 text-right flex-shrink-0">
                  <span className={cn('text-sm font-medium', config.color)}>
                    {config.label}
                  </span>
                </div>

                {/* 漏斗条 */}
                <div className="flex-1 relative">
                  <div
                    className={cn(
                      'h-10 rounded-lg bg-gradient-to-r transition-all duration-500 flex items-center justify-between px-3',
                      config.gradient,
                      'opacity-90 group-hover:opacity-100'
                    )}
                    style={{ width: `${widthPercent}%`, minWidth: '80px' }}
                  >
                    <span className="text-white text-sm font-semibold">{item.count}</span>
                    <span className="text-white/80 text-xs">¥{(item.value / 10000).toFixed(1)}万</span>
                  </div>
                </div>

                {/* 转化率 */}
                <div className="w-16 text-left flex-shrink-0">
                  {index > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {conversionRate}%
                    </span>
                  )}
                </div>
              </div>

              {/* 转化箭头 */}
              {index < data.length - 1 && (
                <div className="flex items-center gap-3 ml-[64px] my-0.5">
                  <div className="w-px h-3 bg-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 汇总统计 */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t">
        <div className="text-center p-2 rounded-lg bg-accent/50">
          <p className="text-lg font-bold">{totalValue > 0 ? `¥${(totalValue / 10000).toFixed(1)}万` : '¥0'}</p>
          <p className="text-xs text-muted-foreground">管道总额</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-accent/50">
          <p className="text-lg font-bold">{data.reduce((s, d) => s + d.count, 0)}</p>
          <p className="text-xs text-muted-foreground">总商机数</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-accent/50">
          <p className="text-lg font-bold text-green-600 dark:text-green-400">{overallConversion}%</p>
          <p className="text-xs text-muted-foreground">总转化率</p>
        </div>
      </div>
    </div>
  );
}
