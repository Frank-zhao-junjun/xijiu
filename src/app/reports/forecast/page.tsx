'use client';

import { useState } from 'react';
import { useCRM } from '@/lib/crm-context';
import { ForecastChart, useForecastData } from '@/components/reports/forecast-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, TrendingDown, Target, DollarSign, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { OPPORTUNITY_STAGE_CONFIG } from '@/lib/crm-types';

type Period = 'quarter' | 'half' | 'year';

export default function ForecastReportPage() {
  const { opportunities } = useCRM();
  const [period, setPeriod] = useState<Period>('quarter');
  
  const { forecastData, totals } = useForecastData(opportunities, period);

  const handleExport = () => {
    const headers = ['月份', '乐观预测', '预期预测', '保守预测', '实际收入'];
    const rows = forecastData.map(item => [
      item.month,
      `¥${item.optimistic.toLocaleString()}`,
      `¥${item.expected.toLocaleString()}`,
      `¥${item.conservative.toLocaleString()}`,
      item.actual ? `¥${item.actual.toLocaleString()}` : '-',
    ]);
    
    // 添加总计行
    rows.push([]);
    rows.push(['总计', `¥${totals.optimistic.toLocaleString()}`, `¥${totals.expected.toLocaleString()}`, `¥${totals.conservative.toLocaleString()}`, '-']);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `收入预测报表_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 计算管道统计
  const activeOpps = opportunities.filter(
    opp => !['closed_won', 'closed_lost'].includes(opp.stage)
  );
  const totalPipeline = activeOpps.reduce((sum, opp) => sum + opp.value, 0);
  // 按阶段分布
  const stageDistribution = Object.entries(OPPORTUNITY_STAGE_CONFIG)
    .filter(([stage]) => !['closed_won', 'closed_lost'].includes(stage))
    .map(([stage, config]) => {
      const stageOpps = activeOpps.filter(opp => opp.stage === stage);
      const amount = stageOpps.reduce((sum, opp) => sum + opp.value, 0);
      const count = stageOpps.length;
      return {
        stage,
        label: config.label,
        color: config.gradient.split(' ')[1] || '#8884d8',
        amount,
        count,
        percentage: totalPipeline > 0 ? (amount / totalPipeline) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">收入预测</h1>
          <p className="text-muted-foreground mt-1">
            基于商机阶段概率预测未来收入
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="预测周期" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quarter">未来3个月</SelectItem>
              <SelectItem value="half">未来6个月</SelectItem>
              <SelectItem value="year">未来12个月</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出CSV
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管道总额</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPipeline)}</div>
            <p className="text-xs text-muted-foreground">
              {activeOpps.length} 个活跃商机
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">预期收入</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.expected)}</div>
            <p className="text-xs text-muted-foreground">
              {period === 'quarter' ? '未来3个月' : period === 'half' ? '未来6个月' : '未来12个月'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">乐观预测</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.optimistic)}</div>
            <p className="text-xs text-muted-foreground">
              所有商机都成交
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">保守预测</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totals.conservative)}</div>
            <p className="text-xs text-muted-foreground">
              按概率60%计算
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 预测图表 */}
      <Card>
        <CardHeader>
          <CardTitle>收入趋势预测</CardTitle>
          <CardDescription>
            展示未来各月的收入预测区间（乐观-预期-保守）
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ForecastChart data={forecastData} />
        </CardContent>
      </Card>

      {/* 阶段分布 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>管道阶段分布</CardTitle>
            <CardDescription>各阶段金额占比</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stageDistribution.map((item) => (
                <div key={item.stage} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={
                          item.color.includes('to-')
                            ? {
                                background: `linear-gradient(135deg, ${item.color.split('-')[1]} to ${item.color.split('-')[2]})`,
                              }
                            : { background: item.color.includes('from-') ? undefined : item.color }
                        }
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {item.count}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${item.percentage}%`,
                        background: `linear-gradient(90deg, ${item.color})`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>月度预测详情</CardTitle>
            <CardDescription>各月预测金额明细</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecastData.map((item) => (
                <div 
                  key={item.month}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 text-center">
                      <span className="text-sm font-medium">{item.month}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-20 h-2 bg-green-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${totals.optimistic > 0 ? (item.optimistic / totals.optimistic) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="w-16 h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${totals.expected > 0 ? (item.expected / totals.expected) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-blue-600">
                      {formatCurrency(item.expected)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      乐观: {formatCurrency(item.optimistic)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 预测说明 */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2 text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium">预测说明</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li><strong>预期预测</strong>：根据各阶段历史转化率加权计算，是最可能实现的收入</li>
                <li><strong>乐观预测</strong>：假设所有商机都按预期成交，代表最大可能性</li>
                <li><strong>保守预测</strong>：按预期值的60%计算，用于风险评估和资金规划</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
