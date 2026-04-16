'use client';

import { useState } from 'react';
import { TeamRankingChart, useTeamRankingApi } from '@/components/reports/team-ranking';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Trophy, TrendingUp, TrendingDown, Medal, Award, Target } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type TimeRange = 'month' | 'quarter' | 'year' | 'all';
type SortBy = 'wonAmount' | 'wonCount' | 'conversionRate' | 'newOpps';

export default function TeamRankingPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [sortBy, setSortBy] = useState<SortBy>('wonAmount');
  
  const { rankingData } = useTeamRankingApi(timeRange);

  const handleExport = () => {
    const headers = ['排名', '成员', '成交金额', '成交数量', '新增商机', '管道金额', '转化率', '环比增长'];
    const rows = rankingData.map((item, index) => [
      (index + 1).toString(),
      item.member.name,
      `¥${item.metrics.wonAmount.toLocaleString()}`,
      item.metrics.wonCount.toString(),
      item.metrics.newOpps.toString(),
      `¥${item.metrics.pipelineAmount.toLocaleString()}`,
      `${item.metrics.conversionRate.toFixed(1)}%`,
      `${item.metrics.growth > 0 ? '+' : ''}${item.metrics.growth.toFixed(1)}%`,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `团队业绩排名_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 计算团队总计
  const totalWonAmount = rankingData.reduce((sum, item) => sum + item.metrics.wonAmount, 0);
  const totalWonCount = rankingData.reduce((sum, item) => sum + item.metrics.wonCount, 0);
  const totalNewOpps = rankingData.reduce((sum, item) => sum + item.metrics.newOpps, 0);
  const avgConversionRate = rankingData.reduce((sum, item) => sum + item.metrics.conversionRate, 0) / Math.max(rankingData.length, 1);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-medium">{rank}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">团队业绩排行</h1>
          <p className="text-muted-foreground mt-1">
            销售团队成员业绩排名，激励良性竞争
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

      {/* 团队总计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">团队总成交</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalWonAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {totalWonCount} 个成交项目
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新增商机</CardTitle>
            <Badge variant="secondary" className="text-xs">总计</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalNewOpps}</div>
            <p className="text-xs text-muted-foreground">
              本周期新增
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
              团队平均
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">冠军</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rankingData[0]?.member.name || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(rankingData[0]?.metrics.wonAmount || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 图表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>业绩对比图</CardTitle>
              <CardDescription>各成员成交金额与新增商机对比</CardDescription>
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="排序方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="wonAmount">按成交金额</SelectItem>
                <SelectItem value="wonCount">按成交数量</SelectItem>
                <SelectItem value="conversionRate">按转化率</SelectItem>
                <SelectItem value="newOpps">按新增商机</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <TeamRankingChart data={rankingData} sortBy={sortBy} />
        </CardContent>
      </Card>

      {/* 排名表格 */}
      <Card>
        <CardHeader>
          <CardTitle>详细排名</CardTitle>
          <CardDescription>各成员详细业绩指标</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">排名</TableHead>
                <TableHead>成员</TableHead>
                <TableHead className="text-right">成交金额</TableHead>
                <TableHead className="text-right">成交数量</TableHead>
                <TableHead className="text-right">新增商机</TableHead>
                <TableHead className="text-right">管道金额</TableHead>
                <TableHead className="text-right">转化率</TableHead>
                <TableHead className="text-right">环比增长</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rankingData.map((item, index) => (
                <TableRow key={item.member.id}>
                  <TableCell>
                    <div className="flex items-center justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span>{item.member.name}</span>
                      {index < 3 && (
                        <Badge variant="outline" className="text-xs">
                          Top {index + 1}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium text-green-600">
                    {formatCurrency(item.metrics.wonAmount)}
                  </TableCell>
                  <TableCell className="text-right">{item.metrics.wonCount}</TableCell>
                  <TableCell className="text-right">{item.metrics.newOpps}</TableCell>
                  <TableCell className="text-right text-blue-600">
                    {formatCurrency(item.metrics.pipelineAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={item.metrics.conversionRate >= 50 ? 'default' : 'secondary'}>
                      {item.metrics.conversionRate.toFixed(1)}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {item.metrics.growth >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={item.metrics.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {item.metrics.growth > 0 ? '+' : ''}{item.metrics.growth.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
