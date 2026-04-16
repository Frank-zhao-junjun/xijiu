'use client';

import { useState } from 'react';
import { ConversionChart, useConversionData } from '@/components/reports/conversion-chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, AlertTriangle, TrendingUp, TrendingDown, Clock, BarChart3, CheckCircle2 } from 'lucide-react';
type TimeRange = 'month' | 'quarter' | 'year' | 'all';

export default function ConversionReportPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [compareEnabled, setCompareEnabled] = useState(false);
  
  const { conversionData, bottleneckStages, overallConversion } = useConversionData(timeRange);

  const handleExport = () => {
    const headers = ['阶段', '进入数量', '流出数量', '转化率', '平均停留时间', '是否瓶颈'];
    const rows = conversionData.map(item => [
      item.stageLabel,
      item.fromCount.toString(),
      item.toCount.toString(),
      `${item.conversionRate.toFixed(1)}%`,
      `${item.avgDays.toFixed(0)}天`,
      item.isBottleneck ? '是' : '否',
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
      '',
      `整体转化率,${overallConversion.toFixed(1)}%`,
      `瓶颈阶段数量,${bottleneckStages.length}`,
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `阶段转化分析_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 计算统计
  const totalEntered = conversionData.reduce((sum, d) => sum + d.fromCount, 0);
  const totalConverted = conversionData.reduce((sum, d) => sum + d.toCount, 0);
  const avgStayDays = conversionData.reduce((sum, d) => sum + d.avgDays, 0) / Math.max(conversionData.length, 1);

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">阶段转化分析</h1>
          <p className="text-muted-foreground mt-1">
            分析各销售阶段的转化效率，找出业务瓶颈
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
          <Button 
            variant={compareEnabled ? 'default' : 'outline'} 
            onClick={() => setCompareEnabled(!compareEnabled)}
            size="sm"
          >
            {compareEnabled ? '对比已开启' : '对比上期'}
          </Button>
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
            <CardTitle className="text-sm font-medium">整体转化率</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallConversion.toFixed(1)}%</div>
            <div className="flex items-center gap-1 mt-1">
              {overallConversion >= 50 ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span className="text-xs text-green-600">表现良好</span>
                </>
              ) : (
                <>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-600">需要提升</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">进入总数</CardTitle>
            <Badge variant="secondary" className="text-xs">累计</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntered}</div>
            <p className="text-xs text-muted-foreground">
              各阶段进入的商机总数
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">转化成功</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalConverted}</div>
            <p className="text-xs text-muted-foreground">
              进入下一阶段的商机数
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均停留</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgStayDays.toFixed(0)}天</div>
            <p className="text-xs text-muted-foreground">
              商机在各阶段平均停留时间
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 转化率图表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>各阶段转化率</CardTitle>
              <CardDescription>
                红色标注表示转化率低于平均的瓶颈阶段
              </CardDescription>
            </div>
            {bottleneckStages.length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {bottleneckStages.length} 个瓶颈
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <ConversionChart data={conversionData} />
        </CardContent>
      </Card>

      {/* 阶段详情表格 */}
      <Card>
        <CardHeader>
          <CardTitle>阶段转化详情</CardTitle>
          <CardDescription>
            各阶段的进入流出情况和效率分析
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {conversionData.map((item, index) => (
              <div key={item.fromStage} className="relative">
                {/* 连接线 */}
                {index < conversionData.length - 1 && (
                  <div className="absolute left-6 top-full w-0.5 h-4 -translate-x-1/2 bg-gray-300 dark:bg-gray-600" />
                )}
                
                <div className={`flex items-center gap-4 p-4 rounded-lg border ${
                  item.isBottleneck 
                    ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' 
                    : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                }`}>
                  {/* 阶段信息 */}
                  <div className="w-24 flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ background: '#3b82f6' }}
                    />
                    <span className="font-medium text-sm">{item.stageLabel}</span>
                  </div>
                  
                  {/* 转化漏斗 */}
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500/30 to-blue-500/60 rounded"
                        style={{ width: `${Math.max(item.fromCount, 1) / Math.max(...conversionData.map(d => d.fromCount)) * 100}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {item.fromCount}
                      </span>
                    </div>
                    <span className="text-muted-foreground">→</span>
                    <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded relative overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 rounded ${
                          item.isBottleneck 
                            ? 'bg-red-500/30' 
                            : 'bg-green-500/30'
                        }`}
                        style={{ width: `${item.conversionRate}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {item.toCount}
                      </span>
                    </div>
                  </div>
                  
                  {/* 转化率 */}
                  <div className="w-24 text-right">
                    <Badge variant={item.isBottleneck ? 'destructive' : 'default'}>
                      {item.conversionRate.toFixed(1)}%
                    </Badge>
                  </div>
                  
                  {/* 平均停留 */}
                  <div className="w-20 text-right text-sm text-muted-foreground">
                    {item.avgDays.toFixed(0)}天
                  </div>
                  
                  {/* 状态 */}
                  <div className="w-20 text-right">
                    {item.isBottleneck ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        瓶颈
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                        <CheckCircle2 className="h-3 w-3" />
                        正常
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 瓶颈建议 */}
      {bottleneckStages.length > 0 && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              瓶颈优化建议
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {bottleneckStages.map((stage) => (
              <div 
                key={stage.stage}
                className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-700"
              >
                <div className="font-medium text-amber-900 dark:text-amber-100">
                  {stage.stageLabel} 阶段转化率偏低 ({stage.conversionRate.toFixed(1)}%)
                </div>
                <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
                  <li>• 检视该阶段的决策标准，确保线索质量</li>
                  <li>• 缩短该阶段的平均停留时间，加快处理速度</li>
                  <li>• 分析流失原因，收集客户反馈</li>
                  <li>• 考虑增加该阶段的资源投入</li>
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
