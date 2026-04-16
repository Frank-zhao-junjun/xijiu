'use client';

import { useState } from 'react';
import { FunnelChart, useFunnelData } from '@/components/reports/funnel-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingDown, TrendingUp, Users, Target, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type TimeRange = 'month' | 'quarter' | 'year' | 'all';

export default function FunnelReportPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const { funnelData, wonOpps, leadCount } = useFunnelData(timeRange);

  const handleExport = () => {
    const headers = ['阶段', '数量', '金额', '转化率'];
    const rows = funnelData.map(item => [
      item.stageLabel,
      item.count.toString(),
      `¥${item.amount.toLocaleString()}`,
      `${item.conversionRate}%`,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `已成交,${wonOpps.count},¥${wonOpps.amount.toLocaleString()},-`,
      `线索数,-,${leadCount},-`,
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `销售漏斗分析_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 计算总体统计
  const totalInPipeline = funnelData.reduce((sum, item) => sum + item.amount, 0);
  const avgConversionRate = funnelData.slice(1).reduce((sum, item) => sum + item.conversionRate, 0) / Math.max(funnelData.length - 1, 1);
  const totalInPipelineCount = funnelData.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">销售漏斗分析</h1>
          <p className="text-muted-foreground mt-1">
            可视化展示销售管道各阶段的转化情况
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="选择时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">本月</SelectItem>
              <SelectItem value="quarter">本季度</SelectItem>
              <SelectItem value="year">本年</SelectItem>
              <SelectItem value="all">全部</SelectItem>
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInPipeline)}</div>
            <p className="text-xs text-muted-foreground">
              {totalInPipelineCount} 个活跃商机
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">线索数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadCount}</div>
            <p className="text-xs text-muted-foreground">
              待转化潜在客户
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已成交</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wonOpps.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(wonOpps.amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均转化率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              各阶段平均转化
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表区域 */}
      <Tabs defaultValue="amount">
        <TabsList>
          <TabsTrigger value="amount">金额视图</TabsTrigger>
          <TabsTrigger value="count">数量视图</TabsTrigger>
        </TabsList>
        <TabsContent value="amount" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>各阶段金额分布</CardTitle>
              <CardDescription>
                展示各销售阶段的金额占比和转化情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FunnelChart data={funnelData} viewMode="amount" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="count" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>各阶段数量分布</CardTitle>
              <CardDescription>
                展示各销售阶段的商机数量和转化情况
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FunnelChart data={funnelData} viewMode="count" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 转化率详情 */}
      <Card>
        <CardHeader>
          <CardTitle>阶段转化详情</CardTitle>
          <CardDescription>
            各阶段的转化率和平均停留时间分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelData.map((item, index) => (
              <div key={item.stage} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{item.stageLabel}</div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${item.conversionRate}%` }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right text-sm font-medium">
                  {item.conversionRate}%
                </div>
                {index > 0 && (
                  <div className="flex items-center gap-1 text-sm">
                    {item.conversionRate < avgConversionRate ? (
                      <>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                        <span className="text-red-500">低于平均</span>
                      </>
                    ) : (
                      <>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                        <span className="text-green-500">高于平均</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
