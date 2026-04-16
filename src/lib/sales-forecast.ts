// 销售预测算法

export interface Opportunity {
  id: string;
  title: string;
  value: string | number;
  stage: string;
  probability: number;
  expected_close_date: string | null;
  created_at: string;
}

export interface ForecastPeriod {
  month: string; // YYYY-MM
  year: number;
  monthNum: number;
}

export interface ForecastItem {
  opportunityId: string;
  opportunityName: string;
  value: number;
  probability: number;
  weightedValue: number;
  stage: string;
  expectedCloseDate: string | null;
}

export interface PeriodForecast {
  period: ForecastPeriod;
  items: ForecastItem[];
  totalValue: number;
  totalWeightedValue: number;
  opportunityCount: number;
  averageProbability: number;
}

// 基于阶段的默认赢率映射
export const STAGE_DEFAULT_PROBABILITIES: Record<string, number> = {
  qualified: 10,
  discovery: 20,
  proposal: 40,
  negotiation: 60,
  contract: 80,
  closed_won: 100,
  closed_lost: 0,
};

// 获取阶段赢率
export function getStageProbability(stage: string, customProbability?: number): number {
  if (stage === 'closed_won') return 100;
  if (stage === 'closed_lost') return 0;
  if (customProbability !== undefined && customProbability > 0) {
    return customProbability;
  }
  return STAGE_DEFAULT_PROBABILITIES[stage] || 20;
}

// 计算加权预测值
export function calculateWeightedValue(value: number, probability: number): number {
  return value * (probability / 100);
}

// 解析商机金额
export function parseOpportunityValue(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
}

// 解析日期为 YYYY-MM 格式
export function parseDateToPeriod(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch {
    return null;
  }
}

// 生成月份期间数组
export function generatePeriods(startDate: Date, endDate: Date): ForecastPeriod[] {
  const periods: ForecastPeriod[] = [];
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (current <= end) {
    periods.push({
      month: `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`,
      year: current.getFullYear(),
      monthNum: current.getMonth() + 1,
    });
    current.setMonth(current.getMonth() + 1);
  }

  return periods;
}

// 按期间分组商机
export function groupByPeriod(
  opportunities: Opportunity[],
  periods: ForecastPeriod[]
): Map<string, Opportunity[]> {
  const grouped = new Map<string, Opportunity[]>();

  for (const period of periods) {
    grouped.set(period.month, []);
  }

  for (const opp of opportunities) {
    if (opp.stage === 'closed_won' || opp.stage === 'closed_lost') continue;

    const period = parseDateToPeriod(opp.expected_close_date);
    if (period && grouped.has(period)) {
      grouped.get(period)!.push(opp);
    } else if (!period) {
      const now = new Date();
      const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (grouped.has(currentPeriod)) {
        grouped.get(currentPeriod)!.push(opp);
      }
    }
  }

  return grouped;
}

// 生成期间预测
export function generatePeriodForecast(
  period: ForecastPeriod,
  opportunities: Opportunity[]
): PeriodForecast {
  const items: ForecastItem[] = opportunities.map((opp) => {
    const value = parseOpportunityValue(opp.value);
    const probability = getStageProbability(opp.stage, opp.probability);
    const weightedValue = calculateWeightedValue(value, probability);

    return {
      opportunityId: opp.id,
      opportunityName: opp.title,
      value,
      probability,
      weightedValue,
      stage: opp.stage,
      expectedCloseDate: opp.expected_close_date,
    };
  });

  const totalValue = items.reduce((sum, item) => sum + item.value, 0);
  const totalWeightedValue = items.reduce((sum, item) => sum + item.weightedValue, 0);
  const opportunityCount = items.length;
  const averageProbability = opportunityCount > 0 ? totalWeightedValue / totalValue * 100 : 0;

  return {
    period,
    items,
    totalValue,
    totalWeightedValue,
    opportunityCount,
    averageProbability,
  };
}

// 生成完整预测报告
export function generateForecastReport(
  opportunities: Opportunity[],
  startDate: Date,
  endDate: Date
): PeriodForecast[] {
  const periods = generatePeriods(startDate, endDate);
  const grouped = groupByPeriod(opportunities, periods);
  const forecasts: PeriodForecast[] = [];

  for (const period of periods) {
    const periodOpps = grouped.get(period.month) || [];
    forecasts.push(generatePeriodForecast(period, periodOpps));
  }

  return forecasts;
}

// 季度汇总
export interface QuarterForecast {
  year: number;
  quarter: number;
  periods: PeriodForecast[];
  totalValue: number;
  totalWeightedValue: number;
  opportunityCount: number;
}

export function getQuarter(monthNum: number): number {
  return Math.ceil(monthNum / 3);
}

export function generateQuarterlyForecast(monthlyForecasts: PeriodForecast[]): QuarterForecast[] {
  const quarterMap = new Map<string, QuarterForecast>();

  for (const monthly of monthlyForecasts) {
    const quarter = getQuarter(monthly.period.monthNum);
    const key = `${monthly.period.year}-Q${quarter}`;

    if (!quarterMap.has(key)) {
      quarterMap.set(key, {
        year: monthly.period.year,
        quarter,
        periods: [],
        totalValue: 0,
        totalWeightedValue: 0,
        opportunityCount: 0,
      });
    }

    const qf = quarterMap.get(key)!;
    qf.periods.push(monthly);
    qf.totalValue += monthly.totalValue;
    qf.totalWeightedValue += monthly.totalWeightedValue;
    qf.opportunityCount += monthly.opportunityCount;
  }

  return Array.from(quarterMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.quarter - b.quarter;
  });
}

// 预测准确度计算
export interface AccuracyMetrics {
  period: string;
  forecastValue: number;
  actualValue: number;
  variance: number;
  variancePercent: number;
  accuracy: number;
}

export function calculateAccuracy(
  forecastValue: number,
  actualValue: number
): { variance: number; variancePercent: number; accuracy: number } {
  const variance = actualValue - forecastValue;
  const variancePercent = forecastValue !== 0 ? (variance / forecastValue) * 100 : 0;
  const accuracy = forecastValue !== 0
    ? Math.max(0, 100 - Math.abs(variancePercent))
    : actualValue === 0 ? 100 : 0;

  return { variance, variancePercent, accuracy };
}

export function generateAccuracyReport(
  forecasts: PeriodForecast[],
  actualResults: Map<string, number>
): AccuracyMetrics[] {
  const currentPeriod = getCurrentPeriod();
  return forecasts
    .filter((f) => f.period.month <= currentPeriod)
    .map((f) => {
      const actual = actualResults.get(f.period.month) || 0;
      const { variance, variancePercent, accuracy } = calculateAccuracy(
        f.totalWeightedValue,
        actual
      );

      return {
        period: f.period.month,
        forecastValue: f.totalWeightedValue,
        actualValue: actual,
        variance,
        variancePercent,
        accuracy,
      };
    });
}

// 预测vs实际对比
export interface ForecastVsActual {
  period: string;
  forecast: number;
  actual: number;
  bestCase: number;
  worstCase: number;
}

export function generateForecastVsActual(
  forecasts: PeriodForecast[],
  actualResults: Map<string, number>
): ForecastVsActual[] {
  return forecasts.map((f) => {
    const actual = actualResults.get(f.period.month) || 0;
    const bestCase = f.items.reduce((sum, item) => sum + item.value, 0);

    return {
      period: f.period.month,
      forecast: f.totalWeightedValue,
      actual,
      bestCase,
      worstCase: 0,
    };
  });
}

function getCurrentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
