'use client';

import { useMemo } from 'react';

interface ChartDataPoint {
  label: string;
  value: number;
  weightedValue: number;
}

interface ForecastChartProps {
  data: ChartDataPoint[];
  title?: string;
  showWeighted?: boolean;
}

function formatCompact(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}亿`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}千`;
  }
  return value.toString();
}

export function ForecastBarChart({ data, title, showWeighted = true }: ForecastChartProps) {
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => Math.max(d.value, d.weightedValue)), 1);
  }, [data]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
              <div className="flex items-center gap-4 text-sm">
                {showWeighted && (
                  <span className="text-green-600 font-medium">
                    {formatCompact(item.weightedValue)}
                  </span>
                )}
                <span className="text-gray-500">
                  {formatCompact(item.value)}
                </span>
              </div>
            </div>
            <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
              {showWeighted && (
                <div
                  className="absolute top-0 left-0 h-full bg-green-500 rounded-lg transition-all duration-500"
                  style={{ width: `${(item.weightedValue / maxValue) * 100}%` }}
                />
              )}
              <div
                className={`absolute top-0 h-full rounded-lg transition-all duration-500 ${
                  showWeighted ? 'bg-blue-400 opacity-60' : 'bg-blue-500'
                }`}
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded" />
          <span className="text-xs text-gray-600">管道金额</span>
        </div>
        {showWeighted && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span className="text-xs text-gray-600">预测金额</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface ForecastTrendChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export function ForecastTrendChart({ data, title }: ForecastTrendChartProps) {
  const maxValue = useMemo(() => {
    return Math.max(...data.map((d) => d.weightedValue), 1);
  }, [data]);

  const points = useMemo(() => {
    const width = 100;
    const height = 60;
    return data.map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * width;
      const y = height - (d.weightedValue / maxValue) * height;
      return { x, y, ...d };
    });
  }, [data, maxValue]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  const areaD = useMemo(() => {
    if (points.length === 0) return '';
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return `${line} L ${points[points.length - 1].x} 100 L 0 100 Z`;
  }, [points]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="relative h-48">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(34, 197, 94)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="rgb(34, 197, 94)" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d={areaD} fill="url(#areaGradient)" />
          <path
            d={pathD}
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="1"
              fill="rgb(34, 197, 94)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500">
          {data.map((d, i) => (
            <span key={i}>{d.label.slice(-5)}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface AccuracyGaugeProps {
  accuracy: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function AccuracyGauge({
  accuracy,
  size = 'md',
  showLabel = true,
}: AccuracyGaugeProps) {
  const sizeClasses = {
    sm: 'w-16 h-16 text-lg',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - accuracy / 100);

  const getColor = () => {
    if (accuracy >= 80) return 'stroke-green-500';
    if (accuracy >= 60) return 'stroke-yellow-500';
    return 'stroke-red-500';
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-gray-200"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className={`${getColor()} transition-all duration-700`}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
          }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-bold text-gray-900">{accuracy.toFixed(0)}%</span>
        </div>
      )}
    </div>
  );
}

interface ComparisonChartProps {
  forecast: number;
  actual: number;
  bestCase: number;
  label?: string;
}

export function ComparisonChart({ forecast, actual, bestCase, label }: ComparisonChartProps) {
  const maxValue = Math.max(forecast, actual, bestCase, 1);

  const bars = [
    { label: '最佳情况', value: bestCase, color: 'bg-blue-400' },
    { label: '预测', value: forecast, color: 'bg-green-500' },
    { label: '实际', value: actual, color: 'bg-purple-500' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {label && <h3 className="text-lg font-semibold text-gray-900 mb-4">{label}</h3>}
      <div className="space-y-4">
        {bars.map((bar) => (
          <div key={bar.label} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-600">{bar.label}</span>
              <span className="text-sm font-medium text-gray-900">{formatCompact(bar.value)}</span>
            </div>
            <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${bar.color} rounded-lg transition-all duration-500`}
                style={{ width: `${(bar.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
