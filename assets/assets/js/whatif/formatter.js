/**
 * Formatter - WhatIf 结果格式化器
 * 将模拟计算结果转换为可读的文本和图表数据
 *
 * 功能:
 *   - 货币格式化 (¥12,345.67)
 *   - 百分比格式化 (+15.2% / -8.3%)
 *   - 颜色编码 (正→绿, 负→红, 零→灰)
 *   - 趋势箭头 (▲ ▼ →)
 *   - 大数字缩写 (1.2万 345.6万)
 *   - 图表数据转换 (ECharts series/data 格式)
 */

class Formatter {
  constructor(options = {}) {
    /** @type {string} 区域设置，默认中文 */
    this._locale = options.locale || 'zh-CN';
    /** @type {string} 货币符号 */
    this._currency = options.currency || 'CNY';
    /** @type {string} 货币符号显示 */
    this._currencySymbol = options.currencySymbol || '¥';
    /** 敏感度阈值(用于颜色分级) */
    this._colorThresholds = {
      high: options.highThreshold || 30,
      medium: options.mediumThreshold || 10
    };
  }

  // ==================== 基础格式化 ====================

  /**
   * 格式化货币值
   * @param {number} value 数值
   * @param {Object} [opts] 选项 { decimals, showSymbol, abbreviate }
   * @returns {string}
   */
  currency(value, opts = {}) {
    const num = this._safeNumber(value);
    const decimals = opts.decimals ?? 2;
    const showSymbol = opts.showSymbol !== false;
    const abbreviate = opts.abbreviate || false;

    if (abbreviate && Math.abs(num) >= 10000) {
      return this._abbreviate(num, showSymbol);
    }

    try {
      const formatted = new Intl.NumberFormat(this._locale, {
        style: 'currency',
        currency: this._currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(num);

      // Intl 可能输出 "CN¥" 或 "￥"，统一替换为配置的符号
      return showSymbol ? formatted.replace(/[A-Z]{0,3}\s*[¥$€£]/, this._currencySymbol) :
        formatted.replace(/[A-Z]{0,3}\s*[¥$€£]\s?/, '');
    } catch {
      return `${showSymbol ? this._currencySymbol : ''}${num.toFixed(decimals)}`;
    }
  }

  /**
   * 格式化百分比（始终带符号）
   * @param {number} value 百分比值 (如 15.5 表示 15.5%)
   * @param {Object} [opts] 选项 { decimals, alwaysSign }
   * @returns {string}
   */
  percent(value, opts = {}) {
    const num = this._safeNumber(value);
    const decimals = opts.decimals ?? 1;
    const alwaysSign = opts.alwaysSign !== false; // 默认始终带符号

    const sign = num > 0 ? '+' : num < 0 ? '-' : '';
    const displaySign = alwaysSign ? sign : '';
    const absNum = Math.abs(num);

    try {
      return `${displaySign}${absNum.toFixed(decimals)}%`;
    } catch {
      return `${displaySign}${num}%`;
    }
  }

  /**
   * 格式化数值（通用）
   * @param {number} value
   * @param {Object} [opts] { decimals, unit }
   * @returns {string}
   */
  number(value, opts = {}) {
    const num = this._safeNumber(value);
    const decimals = opts.decimals ?? 2;
    const unit = opts.unit || '';

    try {
      const formatted = new Intl.NumberFormat(this._locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(num);
      return unit ? `${formatted} ${unit}` : formatted;
    } catch {
      return `${num.toFixed(decimals)} ${unit}`.trim();
    }
  }

  // ==================== 颜色与趋势 ====================

  /**
   * 根据数值获取颜色代码
   * @param {number} value 数值（通常为 delta 或 percentChange）
   * @returns {string} CSS 颜色值
   */
  getColor(value) {
    const num = this._safeNumber(value);
    if (num > 0) return '#22c55e';   // green-500 正向
    if (num < 0) return '#ef4444';     // red-500 负向
    return '#9ca3af';                 // gray-400 零值
  }

  /**
   * 获取颜色等级名称
   * @param {number} value
   * @returns {'positive' | 'negative' | 'neutral'}
   */
  getColorLevel(value) {
    const num = this._safeNumber(value);
    if (num > 0) return 'positive';
    if (num < 0) return 'negative';
    return 'neutral';
  }

  /**
   * 获取敏感度颜色（基于阈值分级）
   * @param {number} absPercentChange 绝对百分比变化
   * @returns {string} CSS 颜色
   */
  getSensitivityColor(absPercentChange) {
    const v = Math.abs(this._safeNumber(absPercentChange));
    if (v >= this._colorThresholds.high) return '#dc2626';   // red-600 高敏感
    if (v >= this._colorThresholds.medium) return '#f59e0b'; // amber-500 中敏感
    return '#3b82f6';                                         // blue-500 低敏感
  }

  /**
   * 获取趋势箭头
   * @param {number} value 变化值
   * @returns {string} Unicode 箭头字符
   */
  getTrendArrow(value) {
    const num = this._safeNumber(value);
    if (num > 0) return '\u25B2'; // ▲
    if (num < 0) return '\u25BC'; // ▼
    return '\u2192';              // →
  }

  /**
   * 获取带颜色的趋势标签
   * @param {number} value
   * @returns {{ text: string, color: string, arrow: string }}
   */
  getTrendLabel(value) {
    const num = this._safeNumber(value);
    return {
      text: this.percent(value),
      color: this.getColor(num),
      arrow: this.getTrendArrow(num),
      level: this.getColorLevel(num)
    };
  }

  // ==================== 指标格式化 ====================

  /**
   * 格式化单个指标为展示对象
   * @param {Metric} metric 来自 SimulationEngine 的 metric 对象
   * @returns {FormattedMetric}
   */
  formatMetric(metric) {
    const trend = this.getTrendLabel(metric.percentChange);
    return {
      name: metric.name,
      originalValue: this.number(metric.originalValue, { unit: metric.unit }),
      simulatedValue: this.number(metric.simulatedValue, { unit: metric.unit }),
      delta: this.currency(Math.abs(metric.delta), { showSymbol: true }),
      deltaRaw: metric.delta,
      percentChange: trend.text,
      percentColor: trend.color,
      arrow: trend.arrow,
      direction: metric.delta > 0 ? 'up' : metric.delta < 0 ? 'down' : 'flat',
      isSensitive: Math.abs(metric.percentChange) >= this._colorThresholds.medium,
      unit: metric.unit || ''
    };
  }

  /**
   * 格式化完整结果为 UI 可消费的结构
   * @param {SimulationResult} result SimulationEngine 返回的结果
   * @returns {FormattedResult}
   */
  formatResult(result) {
    if (!result || result.error) {
      return {
        error: true,
        errorMessage: result?.errorMessage || '未知错误',
        scenarioTitle: result?.scenarioTitle || '计算失败'
      };
    }

    const metrics = (result.metrics || []).map(m => this.formatMetric(m));
    const summaryDelta = result.summary?.totalDelta || 0;
    const summaryPct = result.summary?.totalPercentChange || 0;

    return {
      scenarioId: result.scenarioId,
      scenarioTitle: result.scenarioTitle,
      computedAt: result.computedAt,
      metrics,
      summary: {
        totalOriginal: this.currency(result.summary.totalOriginal),
        totalSimulated: this.currency(result.summary.totalSimulated),
        totalDelta: this.currency(summaryDelta),
        totalDeltaRaw: summaryDelta,
        totalPercentChange: this.percent(summaryPct),
        totalPercentColor: this.getColor(summaryPct),
        totalArrow: this.getTrendArrow(summaryPct),
        direction: result.summary.direction || 'unknown'
      },
      sensitivity: {
        isSensitive: result.sensitivity?.isSensitive || false,
        alertCount: result.sensitivity?.alertCount || 0,
        alerts: (result.sensitivity?.alerts || []).map(a => ({
          ...a,
          color: this.getSensitivityColor(Math.abs(a.percentChange))
        }))
      },
      // 快速摘要文本
      headline: this._generateHeadline(result)
    };
  }

  // ==================== ECharts 数据转换 ====================

  /**
   * 将结果转换为 ECharts 柱状图数据
   * @param {SimulationResult} result
   * @returns {EChartsOption}
   */
  toBarChart(result) {
    const categories = (result.metrics || []).map(m => m.name);
    const originalData = (result.metrics || []).map(m => m.originalValue);
    const simulatedData = (result.metrics || []).map(m => m.simulatedValue);

    return {
      type: 'bar',
      data: {
        categories,
        series: [
          { name: '基准值', data: originalData, itemStyle: { color: '#64748b' } },
          { name: '模拟值', data: simulatedData, itemStyle: { color: '#38bdf8' } }
        ]
      },
      yAxisLabel: (val) => this._abbreviateNumber(val)
    };
  }

  /**
   * 将结果转换为 ECharts 折线图数据（用于价格变动等时间序列场景）
   * @param {SimulationResult} result
   * @param {Object} [extra] 额外配置
   * @returns {EChartsOption}
   */
  toLineChart(result, extra = {}) {
    const months = extra.months || Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    const baseValue = result.summary?.totalOriginal || 0;
    const pct = (result.summary?.totalPercentChange || 0) / 100;
    const monthlyBase = baseValue / months.length;

    return {
      type: 'line',
      data: {
        xAxis: months,
        series: [
          {
            name: '基准成本线',
            data: months.map(() => monthlyBase),
            lineStyle: { color: '#64748b', type: 'dashed' },
            itemStyle: { color: '#64748b' }
          },
          {
            name: '模拟成本线',
            data: months.map((_, i) => monthlyBase * (1 + pct * ((i + 1) / months.length))),
            lineStyle: { color: '#38bdf8' },
            itemStyle: { color: '#38bdf8' },
            areaStyle: { color: 'rgba(56,189,248,0.1)' }
          }
        ]
      }
    };
  }

  /**
   * 将结果转换为 ECharts 雷达图数据（用于供应商对比）
   * @param {SimulationResult} result
   * @returns {EChartsOption}
   */
  toRadarChart(result) {
    const dimensions = (result.metrics || []).map(m => m.name);
    const maxValues = (result.metrics || []).map(m =>
      Math.max(Math.abs(m.originalValue), Math.abs(m.simulatedValue)) * 1.2 || 100
    );

    // 归一化到 0-100
    const normalize = (val, maxVal) => maxVal > 0 ? (Math.abs(val) / maxVal) * 100 : 0;

    return {
      type: 'radar',
      data: {
        indicator: dimensions.map((name, i) => ({ name, max: maxValues[i] })),
        series: [
          {
            name: '当前方案',
            value: (result.metrics || []).map((m, i) => normalize(m.originalValue, maxValues[i])),
            lineStyle: { color: '#ef4444' },
            areaStyle: { color: 'rgba(239,68,68,0.1)' }
          },
          {
            name: '模拟方案',
            value: (result.metrics || []).map((m, i) => normalize(m.simulatedValue, maxValues[i])),
            lineStyle: { color: '#22c55e' },
            areaStyle: { color: 'rgba(34,197,94,0.1)' }
          }
        ]
      }
    };
  }

  // ==================== 私有工具方法 ====================

  /**
   * 安全数值提取
   */
  _safeNumber(value) {
    if (typeof value === 'number' && !isNaN(value) && isFinite(value)) return value;
    return 0;
  }

  /**
   * 大数字缩写 (12345 -> 1.23万)
   */
  _abbreviate(num, showSymbol) {
    const absNum = Math.abs(num);
    let result;
    if (absNum >= 100000000) {
      result = (num / 100000000).toFixed(2) + '亿';
    } else if (absNum >= 10000) {
      result = (num / 10000).toFixed(2) + '万';
    } else {
      result = num.toFixed(2);
    }
    return showSymbol ? this._currencySymbol + result : result;
  }

  _abbreviateNumber(val) {
    const n = Math.abs(val);
    if (n >= 100000000) return (val / 100000000).toFixed(1) + '亿';
    if (n >= 10000) return (val / 10000).toFixed(1) + '万';
    return val.toLocaleString(this._locale);
  }

  /**
   * 生成一行摘要文本
   */
  _generateHeadline(result) {
    const delta = result.summary?.totalDelta || 0;
    const pct = result.summary?.totalPercentChange || 0;
    const dir = result.summary?.direction || '';

    const arrow = this.getTrendArrow(pct);
    const deltaStr = this.currency(Math.abs(delta));
    const pctStr = this.percent(pct);

    const dirText = {
      increase: '成本上升',
      decrease: '成本下降',
      favorable: '切换有利',
      unfavorable: '切换不利',
      savings: '批量节省',
      extra_cost: '批量增加'
    };

    return `${arrow} 模拟结果显示${dirText[dir] || ''}，差额 ${deltaStr} (${pctStr})`;
  }
}

// ==================== 单例导出 ====================

const formatter = new Formatter();

if (typeof globalThis !== 'undefined') {
  globalThis.Formatter = Formatter;
  globalThis.formatter = formatter;
}

export default Formatter;
export { Formatter, formatter };
