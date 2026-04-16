'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Target, BarChart3, RefreshCw } from 'lucide-react';

interface ForecastItem {
  period: string;
  totalValue: number;
  totalWeightedValue: number;
  opportunityCount: number;
  averageProbability: number;
}

interface QuarterForecast {
  year: number;
  quarter: number;
  totalValue: number;
  totalWeightedValue: number;
  opportunityCount: number;
}

interface AccuracyData {
  period: string;
  forecastValue: number;
  actualValue: number;
  accuracy: number;
  variance: number;
}

interface ForecastData {
  monthly: ForecastItem[];
  quarterly: QuarterForecast[];
  summary: {
    totalForecast: number;
    totalPipeline: number;
    totalOpportunities: number;
  };
  accuracy?: AccuracyData[];
}

function formatCurrency(value: number): string {
  if (value >= 100000000) {
    return `¥${(value / 100000000).toFixed(1)}亿`;
  }
  if (value >= 10000) {
    return `¥${(value / 10000).toFixed(1)}万`;
  }
  return `¥${value.toLocaleString()}`;
}

function formatPeriod(period: string): string {
  const [year, month] = period.split('-');
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  return `${year}年${monthNames[parseInt(month, 10) - 1]}`;
}

export default function ForecastsPage() {
  const [view, setView] = useState<'monthly' | 'quarterly' | 'accuracy'>('monthly');
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/forecasts?type=all&includeActual=true');
      if (!response.ok) throw new Error('获取预测数据失败');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, []);

  const maxValue = data
    ? Math.max(...data.monthly.map((m) => m.totalValue), 1)
    : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">销售预测</h1>
                <p className="text-sm text-gray-500">商机金额 × 赢率加权</p>
              </div>
            </div>
            <button
              onClick={fetchForecast}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* 汇总卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-500">预测总额</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.summary.totalForecast)}
                </p>
                <p className="text-sm text-gray-500 mt-1">加权预测值</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-500">管道总额</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data.summary.totalPipeline)}
                </p>
                <p className="text-sm text-gray-500 mt-1">全部商机价值</p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="text-sm text-gray-500">商机数量</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {data.summary.totalOpportunities}
                </p>
                <p className="text-sm text-gray-500 mt-1">活跃商机</p>
              </div>
            </div>

            {/* 视图切换 */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setView('monthly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  view === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                月度预测
              </button>
              <button
                onClick={() => setView('quarterly')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  view === 'quarterly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                季度预测
              </button>
              <button
                onClick={() => setView('accuracy')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  view === 'accuracy'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                预测准确度
              </button>
            </div>

            {/* 月度预测 */}
            {view === 'monthly' && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">月度预测详情</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">月份</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">商机数</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">管道金额</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">预测金额</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">赢率</th>
                        <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase">趋势</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.monthly.map((item) => (
                        <tr key={item.period} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {formatPeriod(item.period)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 text-right">
                            {item.opportunityCount}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                            {formatCurrency(item.totalValue)}
                          </td>
                          <td className="px-6 py-4 text-sm text-green-600 text-right font-semibold">
                            {formatCurrency(item.totalWeightedValue)}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {item.averageProbability.toFixed(0)}%
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${(item.totalValue / maxValue) * 100}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 季度预测 */}
            {view === 'quarterly' && data.quarterly && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">季度预测汇总</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                  {data.quarterly.map((q) => (
                    <div key={`${q.year}-Q${q.quarter}`} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">
                          {q.year}年 Q{q.quarter}
                        </span>
                        <span className="text-xs text-gray-500">{q.opportunityCount} 个商机</span>
                      </div>
                      <p className="text-xl font-bold text-gray-900 mb-1">
                        {formatCurrency(q.totalWeightedValue)}
                      </p>
                      <p className="text-xs text-gray-500">
                        管道: {formatCurrency(q.totalValue)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 预测准确度 */}
            {view === 'accuracy' && data.accuracy && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">预测 vs 实际</h2>
                </div>
                {data.accuracy.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    暂无历史预测数据可供对比
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">月份</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">预测金额</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">实际金额</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">偏差</th>
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">准确度</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.accuracy.map((item) => (
                          <tr key={item.period} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {formatPeriod(item.period)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                              {formatCurrency(item.forecastValue)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 text-right">
                              {formatCurrency(item.actualValue)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right">
                              <span className={item.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {item.variance >= 0 ? '+' : ''}{formatCurrency(item.variance)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                item.accuracy >= 80 ? 'bg-green-100 text-green-800' :
                                item.accuracy >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.accuracy.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {loading && !data && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        )}
      </main>
    </div>
  );
}
