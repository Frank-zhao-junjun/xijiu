/**
 * AIExplainer - WhatIf 结果解释器
 * 将模拟计算结果转换为业务语言解释
 *
 * 功能:
 *   - 生成自然语言摘要（适合采购总监阅读）
 *   - 识别关键洞察点（异常/机会/风险）
 *   - 提供行动建议（基于结果数据）
 *   - 模板变量替换系统
 *
 * 设计原则:
 *   - 专业、简洁、数据驱动
 *   - 面向决策者而非技术人员
 *   - 支持多场景差异化解释
 */

class AIExplainer {
  constructor(options = {}) {
    /** 解释详细程度: 'brief' | 'standard' | 'detailed' */
    this._detailLevel = options.detailLevel || 'standard';
    /** 语言风格 */
    this._tone = options.tone || 'professional'; // professional | casual
    /** 模板变量前缀 */
    this._varPrefix = options.varPrefix || '{{';
    this._varSuffix = options.varSuffix || '}}';

    // 场景解释模板库
    this._templates = this._buildTemplateLibrary();
  }

  // ==================== 公共 API ====================

  /**
   * 生成完整解释报告
   * @param {FormattedResult} formattedResult 来自 Formatter.formatResult() 的结果
   * @returns {ExplanationReport}
   */
  explain(formattedResult) {
    if (!formattedResult || formattedResult.error) {
      return this._errorReport(formattedResult?.errorMessage || '无法生成解释');
    }

    const scenarioId = formattedResult.scenarioId;
    const template = this._templates[scenarioId] || this._templates._default;

    return {
      scenarioId,
      scenarioTitle: formattedResult.scenarioTitle,
      generatedAt: new Date().toISOString(),

      // 核心输出
      summary: this._generateSummary(formattedResult, template),
      insights: this._generateInsights(formattedResult),
      recommendations: this._generateRecommendations(formattedResult, template),

      // 原始数据引用
      dataRef: {
        totalDelta: formattedResult.summary?.totalDeltaRaw || 0,
        totalPercentChange: parseFloat(String(formattedResult.summary?.totalPercentChange || '0').replace(/[+%]/g, '')) || 0,
        direction: formattedResult.summary?.direction || 'unknown',
        metricCount: formattedResult.metrics?.length || 0,
        sensitivityAlerts: formattedResult.sensitivity?.alerts || []
      }
    };
  }

  /**
   * 仅生成摘要（精简版）
   */
  summarize(formattedResult) {
    const report = this.explain(formattedResult);
    return report.summary;
  }

  /**
   * 设置解释详细程度
   * @param {'brief'|'standard'|'detailed'} level
   */
  setDetailLevel(level) {
    if (['brief', 'standard', 'detailed'].includes(level)) {
      this._detailLevel = level;
    }
  }

  // ==================== 摘要生成 ====================

  _generateSummary(result, template) {
    const vars = this._extractVars(result);
    const summaryTpl = template.summary || this._templates._default.summary;

    return this._renderTemplate(summaryTpl, vars);
  }

  // ==================== 洞察识别 ====================

  _generateInsights(result) {
    const insights = [];
    const delta = result.dataRef?.totalDelta || 0;
    const pct = result.dataRef?.totalPercentChange || 0;
    const absPct = Math.abs(pct);
    const metrics = result.metrics || [];
    const alerts = result.dataRef?.sensitivityAlerts || [];

    // 洞察1: 成本变动幅度判断
    if (absPct >= 20) {
      insights.push({
        type: absPct > 0 ? 'risk' : 'opportunity',
        level: 'high',
        title: absPct > 0 ? '成本显著上升风险' : '显著降本机会',
        description: `模拟结果显示总成本变化达到 ${absPct.toFixed(1)}%，${absPct > 0 ? '超出常规波动范围，建议评估应对策略' : '属于重大优化窗口，建议尽快落地执行'}`
      });
    } else if (absPct >= 10) {
      insights.push({
        type: absPct > 0 ? 'warning' : 'opportunity',
        level: 'medium',
        title: absPct > 0 ? '成本上涨趋势' : '可观的节省空间',
        description: `成本变化约 ${absPct.toFixed(1)}%，${absPct > 0 ? '需关注后续走势，考虑锁定价格或寻找替代方案' : '具备一定优化价值，建议纳入采购策略考量'}`
      });
    }

    // 洞察2: 单项指标极值检测
    const extremeMetrics = metrics.filter(m => {
      const pctStr = String(m.percentChange || '').replace(/[+%▲▼→\s]/g, '');
      const pctVal = parseFloat(pctStr);
      return !isNaN(pctVal) && Math.abs(pctVal) >= 10 && (m.deltaRaw || 0) !== 0;
    });
    if (extremeMetrics.length > 0) {
      const topMetric = extremeMetrics.sort((a, b) => {
        const pa = parseFloat(String(a.percentChange).replace(/[+%▲▼→\s]/g, ''));
        const pb = parseFloat(String(b.percentChange).replace(/[+%▲▼→\s]/g, ''));
        return Math.abs(pb) - Math.abs(pa);
      })[0];
      insights.push({
        type: 'analysis',
        level: 'medium',
        title: `关键驱动因素: ${topMetric.name}`,
        description: `「${topMetric.name}」是本次模拟中变化最大的指标，变动 ${topMetric.percentChange}，是影响整体结果的核心因素`
      });
    }

    // 洞察2b: 如果没有极值指标但有总体变化，添加通用洞察
    if (absPct >= 5 && extremeMetrics.length === 0) {
      insights.push({
        type: 'analysis',
        level: 'low',
        title: '成本结构分析',
        description: `本次模拟中各项指标变化较为均匀，建议关注综合效应而非单一因素，可进一步拆解各参数的独立影响`
      });
    }

    // 洞察3: 兜底 - 确保至少有2条洞察（当有数据时）
    if (insights.length < 2 && metrics.length > 3) {
      const sortedByAbsDelta = [...metrics]
        .filter(m => (m.deltaRaw || 0) !== 0)
        .sort((a, b) => Math.abs(b.deltaRaw) - Math.abs(a.deltaRaw));
      if (sortedByAbsDelta.length > 0) {
        const secondMetric = sortedByAbsDelta[0];
        insights.push({
          type: 'analysis',
          level: 'low',
          title: `次级影响因素: ${secondMetric.name}`,
          description: `「${secondMetric.name}」变动 ${secondMetric.percentChange}，是仅次于主驱动因素的第二大变量`
        });
      }
    }

    // 洞察3: 敏感度告警解读
    if (alerts.length > 0) {
      const highAlerts = alerts.filter(a => a.level === 'high');
      if (highAlerts.length > 0) {
        insights.push({
          type: 'alert',
          level: 'high',
          title: `${highAlerts.length} 项高敏感度指标`,
          description: `以下指标对参数变化高度敏感，小幅调整即可能产生较大影响：${highAlerts.map(a => a.metricName).join('、')}`
        });
      }
    }

    // 洞察4: 方向性洞察
    const direction = result.dataRef?.direction;
    if (direction === 'favorable') {
      insights.push({ type: 'opportunity', level: 'low', title: '供应商切换有利', description: '综合评估显示候选方案在总成本上优于当前方案，建议推进供应商准入流程' });
    } else if (direction === 'unfavorable') {
      insights.push({ type: 'risk', level: 'low', title: '供应商切换需谨慎', description: '综合评估显示切换后总成本反而上升，建议重新评估或谈判更优条款' });
    } else if (direction === 'savings') {
      insights.push({ type: 'opportunity', level: 'medium', title: '批量采购策略有效', description: '批量采购模式带来明确成本节约，建议结合资金状况和仓储能力确定最优批量倍数' });
    }

    return insights.slice(0, 5); // 最多5条洞察
  }

  // ==================== 行动建议 ====================

  _generateRecommendations(result, template) {
    const recs = [];
    const vars = this._extractVars(result);
    const delta = result.dataRef?.totalDelta || 0;
    const pct = result.dataRef?.totalPercentChange || 0;
    const absPct = Math.abs(pct);

    // 从模板获取场景专属建议
    const baseRecs = template.recommendations || [];
    baseRecs.forEach(rec => {
      recs.push({
        priority: rec.priority || 'medium',
        category: rec.category || 'general',
        action: this._renderTemplate(rec.template, vars)
      });
    });

    // 通用建议（根据数据动态生成）
    if (absPct >= 15 && pct > 0) {
      recs.push({
        priority: 'high',
        category: 'cost_control',
        action: `考虑到成本上升约 ${absPct.toFixed(1)}%，建议立即启动价格谈判，或寻找替代供应商进行比价`
      });
    }

    if (absPct >= 10 && pct < 0) {
      recs.push({
        priority: 'high',
        category: 'optimization',
        action: `模拟显示可节约成本，建议在下个采购周期将此方案纳入执行计划，预计年度节省 {{annualSaving}}`
      });
    }

    if (result.dataRef?.sensitivityAlerts?.length >= 2) {
      recs.push({
        priority: 'medium',
        category: 'risk_mgmt',
        action: `多项指标对参数敏感，建议建立价格监控机制，设置预警阈值以便及时响应市场变化`
      });
    }

    // 去重并排序
    const seen = new Set();
    return recs
      .filter(r => {
        const key = r.action.substring(0, 30);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] || 1) - (order[b.priority] || 1);
      })
      .slice(0, 6);
  }

  // ==================== 模板引擎 ====================

  /**
   * 渲染模板（变量替换）
   */
  _renderTemplate(template, vars) {
    if (!template) return '';
    let output = template;

    for (const [key, value] of Object.entries(vars)) {
      const placeholder = `${this._varPrefix}${key}${this._varSuffix}`;
      output = output.split(placeholder).join(String(value ?? ''));
    }

    return output.trim();
  }

  /**
   * 从结果中提取模板变量
   */
  _extractVars(result) {
    const summary = result.summary || {};
    const dataRef = result.dataRef || {};
    const metrics = result.metrics || [];

    return {
      // 摘要级变量
      scenarioTitle: result.scenarioTitle || '',
      totalOriginal: summary.totalOriginal || '-',
      totalSimulated: summary.totalSimulated || '-',
      totalDelta: summary.totalDelta || '-',
      totalPercentChange: summary.totalPercentChange || '-',
      totalArrow: summary.totalArrow || '',

      // 数值变量
      deltaAbs: Math.abs(dataRef.totalDelta || 0).toLocaleString('zh-CN'),
      percentAbs: Math.abs(dataRef.totalPercentChange || 0).toFixed(1),
      percentSigned: (dataRef.totalPercentChange >= 0 ? '+' : '') + (dataRef.totalPercentChange || 0).toFixed(1),
      directionText: this._dirToText(dataRef.direction),
      priceDirection: (dataRef.totalPercentChange || 0) > 0 ? '价格上涨' : '价格变动',
      metricCount: metrics.length,

      // 年化估算（粗略）
      annualSaving: Math.abs(dataRef.totalDelta || 0) > 0
        ? '¥' + (Math.abs(dataRef.totalDelta) * 2).toLocaleString('zh-CN', { maximumFractionDigits: 0 })
        : '待评估',

      // 时间戳
      now: new Date().toLocaleDateString('zh-CN'),
      analyst: 'AI 分析助手'
    };
  }

  _dirToText(dir) {
    const map = {
      increase: '上升',
      decrease: '下降',
      favorable: '有利',
      unfavorable: '不利',
      savings: '节省',
      extra_cost: '增加'
    };
    return map[dir] || '变化';
  }

  // ==================== 模板库 ====================

  _buildTemplateLibrary() {
    return {

      // ===== 价格变动场景 =====
      'price-change': {
        summary: `【{{scenarioTitle}}】\n\n` +
          `在当前参数假设下，{{priceDirection}}将对采购成本产生直接影响。\n\n` +
          `基准总成本为 {{totalOriginal}}，模拟后变为 {{totalSimulated}}，` +
          `差额 {{totalDelta}}（{{totalPercentChange}}{{totalArrow}}）。\n\n` +
          `若该价格变动持续，预计年度影响金额可达 {{annualSaving}} 左右。`,

        recommendations: [
          {
            priority: 'high',
            category: 'procurement',
            template: `建议与供应商提前锁定价格，或通过期货/远期合约对冲价格风险。当前 {{percentSigned}}% 的变动幅度已超出可控范围。`
          },
          {
            priority: 'medium',
            category: 'strategy',
            template: `考虑建立安全库存缓冲，在价格低位时适当增加采购量，平摊单位成本。`
          },
          {
            priority: 'low',
            category: 'monitoring',
            template: `建议将该物料列入重点监控清单，设置 ±5% 价格预警阈值。`
          }
        ]
      },

      // ===== 供应商切换场景 =====
      'supplier-switch': {
        summary: `【{{scenarioTitle}}】\n\n` +
          `对比分析显示：当前供应商方案总成本 {{totalOriginal}}，` +
          `候选供应商方案总成本 {{totalSimulated}}，差额 {{totalDelta}}（{{totalPercentChange}}）。\n\n` +
          `结论：切换方案总体{{directionText}}。除直接成本外，还需综合考虑质量稳定性、交期可靠性、长期合作潜力等软性因素。`,

        recommendations: [
          {
            priority: 'high',
            category: 'evaluation',
            template: `建议安排实地考察或小批量试单，验证候选供应商的实际交付能力和质量水平。`
          },
          {
            priority: 'medium',
            category: 'negotiation',
            template: `可将本次模拟结果作为谈判筹码，要求当前供应商匹配或改善报价条件。`
          },
          {
            priority: 'low',
            category: 'risk',
            template: `建议保留双供应商策略，避免单一来源依赖带来的供应中断风险。`
          }
        ]
      },

      // ===== 批量采购场景 =====
      'bulk-purchase': {
        summary: `【{{scenarioTitle}}】\n\n` +
          `批量采购模式下，综合成本由「采购支出 + 库存持有成本」两部分构成。\n\n` +
          `基准方案总成本 {{totalOriginal}}，批量方案总成本 {{totalSimulated}}，` +
          `净效果 {{totalDelta}}（{{totalPercentChange}}）。\n\n` +
          `批量折扣带来的采购支出下降与库存资金占用增加之间存在权衡关系，最优倍数取决于具体业务条件。`,

        recommendations: [
          {
            priority: 'high',
            category: 'optimization',
            template: `建议测算不同批量倍数下的总成本曲线，找到理论最优采购批量（EOQ模型参考值）。`
          },
          {
            priority: 'medium',
            category: 'finance',
            template: `评估企业现金流状况，确认是否能够支撑大批量采购的一次性付款压力。`
          },
          {
            priority: 'low',
            category: 'warehouse',
            template: `核实仓库容量和周转效率，确保大批量到货后的存储和领用不会造成积压。`
          }
        ]
      },

      // ===== 默认模板 =====
      '_default': {
        summary: `【{{scenarioTitle}}】\n\n` +
          `模拟分析完成。基准方案总成本 {{totalOriginal}}，模拟方案总成本 {{totalSimulated}}，` +
          `差异 {{totalDelta}}（{{totalPercentChange}}{{totalArrow}}）。\n\n` +
          `请关注各分项指标的变动情况，识别主要驱动因素。`,

        recommendations: [
          {
            priority: 'medium',
            category: 'review',
            template: `建议复核输入参数的合理性，必要时进行敏感性分析验证结论稳健性。`
          }
        ]
      }
    };
  }

  // ==================== 错误处理 ====================

  _errorReport(message) {
    return {
      error: true,
      errorMessage: message,
      generatedAt: new Date().toISOString(),
      summary: `无法生成解释报告：${message}`,
      insights: [],
      recommendations: [{
        priority: 'high',
        category: 'system',
        action: '请检查输入数据完整性后重试'
      }],
      dataRef: null
    };
  }
}

// ==================== 单例导出 ====================

const explainer = new AIExplainer();

if (typeof globalThis !== 'undefined') {
  globalThis.AIExplainer = AIExplainer;
  globalThis.aiExplainer = explainer;
}

export default AIExplainer;
export { AIExplainer, explainer };
