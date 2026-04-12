/**
 * SimulationEngine - WhatIf 模拟计算引擎
 * 处理场景的数值计算，返回标准化结果
 *
 * 结果结构:
 *   {
 *     scenarioId, scenarioTitle,
 *     metrics: [{ name, originalValue, simulatedValue, delta, percentChange, unit }],
 *     summary: { totalOriginal, totalSimulated, totalDelta, totalPercentChange },
 *     sensitivity: { threshold, isSensitive, alerts[] },
 *     computedAt
 *   }
 */

class SimulationEngine {
  constructor() {
    /** 敏感度阈值: 百分比变化超过此值视为敏感 */
    this._sensitivityThreshold = 10;
    /** 最大迭代次数(用于敏感性分析) */
    this._maxSensitivitySteps = 5;
  }

  // ==================== 公共 API ====================

  /**
   * 执行场景模拟计算
   * @param {string} scenarioId 场景ID
   * @param {Object} paramValues 用户输入的参数值 { key: value }
   * @param {Object} [context] 上下文数据 (物料列表、供应商列表等)
   * @returns {SimulationResult} 标准化结果对象
   */
  calculate(scenarioId, paramValues = {}, context = {}) {
    // 参数校验
    if (!scenarioId || typeof scenarioId !== 'string') {
      throw new Error('[SimulationEngine] scenarioId 必须为非空字符串');
    }

    const safeParams = this._sanitizeParams(paramValues);

    let result;
    switch (scenarioId) {
      case 'price-change':
        result = this._calcPriceChange(safeParams, context);
        break;
      case 'supplier-switch':
        result = this._calcSupplierSwitch(safeParams, context);
        break;
      case 'bulk-purchase':
        result = this._calcBulkPurchase(safeParams, context);
        break;
      default:
        throw new Error(`[SimulationEngine] 不支持的场景ID: ${scenarioId}`);
    }

    // 后处理: 添加元数据和敏感度分析
    result.scenarioId = scenarioId;
    result.computedAt = new Date().toISOString();
    result.sensitivity = this._analyzeSensitivity(result.metrics);

    return result;
  }

  /**
   * 批量执行多个场景的计算
   * @param {Array<{scenarioId, params}>} tasks 计算任务列表
   * @param {Object} [context] 共享上下文
   * @returns {SimulationResult[]}
   */
  calculateBatch(tasks, context = {}) {
    if (!Array.isArray(tasks)) {
      throw new Error('[SimulationEngine] calculateBatch 需要 Array 类型参数');
    }
    return tasks.map(task => {
      try {
        return this.calculate(task.scenarioId, task.params || {}, context);
      } catch (e) {
        return this._errorResult(task.scenarioId, e.message);
      }
    });
  }

  /**
   * 设置敏感度阈值
   * @param {number} threshold 百分比值，默认10%
   */
  setSensitivityThreshold(threshold) {
    if (typeof threshold !== 'number' || threshold < 0) {
      throw new Error('[SimulationEngine] threshold 必须为非负数');
    }
    this._sensitivityThreshold = threshold;
  }

  // ==================== 场景计算器 ====================

  /**
   * 价格变动场景计算
   * 模拟原料单价变动对总成本的影响
   */
  _calcPriceChange(params, ctx) {
    const priceChangePct = this._num(params.priceChangePercent, 10);
    const months = Math.max(1, this._num(params.affectedMonths, 12));
    const monthlyVolume = Math.max(0.001, this._num(params.volumeAssumption, 100));
    const material = this._resolveMaterial(ctx, params.materialId);

    // 基准单价 (从上下文获取或使用默认)
    const baseUnitPrice = material?.unit_price || 8500;

    // 计算核心指标
    const monthlyCostOriginal = baseUnitPrice * monthlyVolume;
    const priceMultiplier = 1 + priceChangePct / 100;
    const newUnitPrice = baseUnitPrice * priceMultiplier;
    const monthlyCostSimulated = newUnitPrice * monthlyVolume;

    const totalOriginal = monthlyCostOriginal * months;
    const totalSimulated = monthlyCostSimulated * months;

    return {
      scenarioTitle: '价格变动分析',
      metrics: [
        {
          name: '基准单价',
          originalValue: baseUnitPrice,
          simulatedValue: newUnitPrice,
          delta: newUnitPrice - baseUnitPrice,
          percentChange: priceChangePct,
          unit: '元/吨'
        },
        {
          name: '月均采购成本',
          originalValue: monthlyCostOriginal,
          simulatedValue: monthlyCostSimulated,
          delta: monthlyCostSimulated - monthlyCostOriginal,
          percentChange: priceChangePct,
          unit: '元'
        },
        {
          name: `${months}个月累计成本`,
          originalValue: totalOriginal,
          simulatedValue: totalSimulated,
          delta: totalSimulated - totalOriginal,
          percentChange: priceChangePct,
          unit: '元'
        },
        {
          name: '月均采购量',
          originalValue: monthlyVolume,
          simulatedValue: monthlyVolume,
          delta: 0,
          percentChange: 0,
          unit: '吨'
        }
      ],
      summary: {
        totalOriginal,
        totalSimulated,
        totalDelta: totalSimulated - totalOriginal,
        totalPercentChange: priceChangePct,
        direction: priceChangePct >= 0 ? 'increase' : 'decrease'
      }
    };
  }

  /**
   * 供应商切换场景计算
   * 对比当前供应商与候选供应商的综合成本差异
   */
  _calcSupplierSwitch(params, ctx) {
    const annualVolume = Math.max(1, this._num(params.annualVolume, 1200));
    const evalMonths = Math.max(3, this._num(params.evaluationPeriod, 12));
    const currentSupplier = this._resolveSupplier(ctx, params.currentSupplierId);
    const candidateSupplier = this._resolveSupplier(ctx, params.candidateSupplierId);

    // 从上下文获取供应商价格，或使用默认值
    const currentPrice = currentSupplier?.avg_price || 8500;
    const candidatePrice = candidateSupplier?.avg_price || 8200; // 默认略低

    // 质量评分影响系数 (质量越低，隐性成本越高)
    const currentQualityFactor = this._qualityToCostFactor(currentSupplier?.quality_score || 4.5);
    const candidateQualityFactor = this._qualityToCostFactor(candidateSupplier?.quality_score || 4.3);

    // 交期评分影响 (交期越长，资金占用成本越高)
    const currentDeliveryDays = currentSupplier?.avg_delivery_days || 7;
    const candidateDeliveryDays = candidateSupplier?.avg_delivery_days || 10;

    const periodVolume = annualVolume * (evalMonths / 12);

    // 直接采购成本
    const currentDirectCost = currentPrice * periodVolume;
    const candidateDirectCost = candidatePrice * periodVolume;

    // 质量隐性成本 (不合格率导致的返工/损耗)
    const qualityAdjustRate = 0.03; // 每1分质量差距=3%隐性成本
    const currentQualityCost = currentDirectCost * currentQualityFactor;
    const candidateQualityCost = candidateDirectCost * candidateQualityFactor;

    // 资金占用成本 (基于交期天数差)
    const dailyCapitalRate = 0.0003; // 日资金成本率 ~11%/年
    const currentCapitalCost = currentDirectCost * currentDeliveryDays * dailyCapitalRate;
    const candidateCapitalCost = candidateDirectCost * candidateDeliveryDays * dailyCapitalRate;

    const currentTotal = currentDirectCost + currentQualityCost + currentCapitalCost;
    const candidateTotal = candidateDirectCost + candidateQualityCost + candidateCapitalCost;

    return {
      scenarioTitle: '供应商切换评估',
      metrics: [
        {
          name: '直接采购成本',
          originalValue: currentDirectCost,
          simulatedValue: candidateDirectCost,
          delta: candidateDirectCost - currentDirectCost,
          percentChange: ((candidateDirectCost - currentDirectCost) / currentDirectCost * 100),
          unit: '元'
        },
        {
          name: '质量隐性成本',
          originalValue: currentQualityCost,
          simulatedValue: candidateQualityCost,
          delta: candidateQualityCost - currentQualityCost,
          percentChange: ((candidateQualityCost - currentQualityCost) / Math.max(1, currentQualityCost) * 100),
          unit: '元'
        },
        {
          name: '资金占用成本',
          originalValue: currentCapitalCost,
          simulatedValue: candidateCapitalCost,
          delta: candidateCapitalCost - currentCapitalCost,
          percentChange: ((candidateCapitalCost - currentCapitalCost) / Math.max(1, currentCapitalCost) * 100),
          unit: '元'
        },
        {
          name: '综合总成本',
          originalValue: currentTotal,
          simulatedValue: candidateTotal,
          delta: candidateTotal - currentTotal,
          percentChange: ((candidateTotal - currentTotal) / Math.max(1, currentTotal) * 100),
          unit: '元'
        }
      ],
      summary: {
        totalOriginal: currentTotal,
        totalSimulated: candidateTotal,
        totalDelta: candidateTotal - currentTotal,
        totalPercentChange: ((candidateTotal - currentTotal) / Math.max(1, currentTotal) * 100),
        direction: candidateTotal <= currentTotal ? 'favorable' : 'unfavorable',
        comparison: {
          currentSupplier: currentSupplier?.name || '当前供应商',
          candidateSupplier: candidateSupplier?.name || '候选供应商',
          evalPeriod: evalMonths + '个月'
        }
      }
    };
  }

  /**
   * 批量采购场景计算
   * 分析不同批量和折扣对总成本的影响
   */
  _calcBulkPurchase(params, ctx) {
    const baseQty = Math.max(1, this._num(params.baseOrderQty, 50));
    const multiplier = Math.max(1, this._num(params.bulkMultiplier, 2));
    const discountRate = Math.max(0, Math.min(1, this._num(params.discountRate, 5) / 100));
    const holdingCostPct = Math.max(0, this._num(params.holdingCostRate, 15) / 100);
    const material = this._resolveMaterial(ctx, params.materialId);

    const unitPrice = material?.unit_price || 8500;
    const ordersPerYear = 12; // 假设每月1次基准订单

    // ===== 基准方案 (小批量高频次) =====
    const baseOrderValue = baseQty * unitPrice;
    const baseAnnualOrders = ordersPerYear;
    const baseAnnualPurchase = baseOrderValue * baseAnnualOrders;
    // 小批量时平均库存 = 单次批量 / 2
    const baseAvgInventory = baseQty / 2;
    const baseHoldingCost = baseAvgInventory * unitPrice * holdingCostPct;
    const baseTotalCost = baseAnnualPurchase + baseHoldingCost;

    // ===== 模拟方案 (大批量低频次) =====
    const bulkQty = baseQty * multiplier;
    const bulkOrdersPerYear = Math.max(1, Math.round(ordersPerYear / multiplier));
    const discountedPrice = unitPrice * (1 - discountRate);
    const bulkOrderValue = bulkQty * discountedPrice;
    const bulkAnnualPurchase = bulkOrderValue * bulkOrdersPerYear;
    const bulkAvgInventory = bulkQty / 2;
    const bulkHoldingCost = bulkAvgInventory * discountedPrice * holdingCostPct;
    const bulkTotalCost = bulkAnnualPurchase + bulkHoldingCost;

    // 节省金额
    const savings = baseTotalCost - bulkTotalCost;

    return {
      scenarioTitle: '批量采购策略',
      metrics: [
        {
          name: '单次采购量',
          originalValue: baseQty,
          simulatedValue: bulkQty,
          delta: bulkQty - baseQty,
          percentChange: ((bulkQty - baseQty) / baseQty * 100),
          unit: '吨'
        },
        {
          name: '年采购次数',
          originalValue: baseAnnualOrders,
          simulatedValue: bulkOrdersPerYear,
          delta: bulkOrdersPerYear - baseAnnualOrders,
          percentChange: ((bulkOrdersPerYear - baseAnnualOrders) / baseAnnualOrders * 100),
          unit: '次/年'
        },
        {
          name: '年采购支出',
          originalValue: baseAnnualPurchase,
          simulatedValue: bulkAnnualPurchase,
          delta: bulkAnnualPurchase - baseAnnualPurchase,
          percentChange: ((bulkAnnualPurchase - baseAnnualPurchase) / baseAnnualPurchase * 100),
          unit: '元'
        },
        {
          name: '年库存持有成本',
          originalValue: baseHoldingCost,
          simulatedValue: bulkHoldingCost,
          delta: bulkHoldingCost - baseHoldingCost,
          percentChange: ((bulkHoldingCost - baseHoldingCost) / Math.max(1, baseHoldingCost) * 100),
          unit: '元'
        },
        {
          name: '综合总成本',
          originalValue: baseTotalCost,
          simulatedValue: bulkTotalCost,
          delta: bulkTotalCost - baseTotalCost,
          percentChange: ((bulkTotalCost - baseTotalCost) / baseTotalCost * 100),
          unit: '元'
        },
        {
          name: '年节省金额',
          originalValue: 0,
          simulatedValue: Math.max(0, savings),
          delta: Math.max(0, savings),
          percentChange: savings > 0 ? Math.abs(savings / baseTotalCost * 100) : 0,
          unit: '元'
        }
      ],
      summary: {
        totalOriginal: baseTotalCost,
        totalSimulated: bulkTotalCost,
        totalDelta: bulkTotalCost - baseTotalCost,
        totalPercentChange: ((bulkTotalCost - baseTotalCost) / baseTotalCost * 100),
        direction: savings >= 0 ? 'savings' : 'extra_cost',
        savingsAmount: Math.max(0, savings),
        breakdown: {
          purchaseDelta: bulkAnnualPurchase - baseAnnualPurchase,
          holdingDelta: bulkHoldingCost - baseHoldingCost
        }
      }
    };
  }

  // ==================== 敏感度分析 ====================

  /**
   * 对指标进行敏感度检测
   * @param {Metric[]} metrics 计算出的指标数组
   * @returns {SensitivityAnalysis}
   */
  _analyzeSensitivity(metrics) {
    const alerts = [];
    let maxAbsPct = 0;

    for (const m of metrics) {
      const absPct = Math.abs(m.percentChange || 0);
      maxAbsPct = Math.max(maxAbsPct, absPct);

      if (absPct >= this._sensitivityThreshold) {
        alerts.push({
          metricName: m.name,
          percentChange: m.percentChange,
          level: absPct >= 30 ? 'high' : absPct >= 20 ? 'medium' : 'low',
          message: `${m.name} 变化 ${m.percentChange >= 0 ? '+' : ''}${m.percentChange.toFixed(1)}%，${absPct >= 30 ? '需重点关注' : '建议关注'}`
        });
      }
    }

    return {
      threshold: this._sensitivityThreshold,
      isSensitive: alerts.length > 0,
      maxAbsPercentChange: maxAbsPct,
      alertCount: alerts.length,
      alerts
    };
  }

  // ==================== 工具方法 ====================

  /**
   * 安全提取数值参数
   * @param {*} value 输入值
   * @param {number} fallback 默认值
   * @returns {number}
   */
  _num(value, fallback = 0) {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) return parsed;
    }
    return fallback;
  }

  /**
   * 清洗和校验参数
   * @param {Object} params 原始参数
   * @returns {Object} 安全参数
   */
  _sanitizeParams(params) {
    if (!params || typeof params !== 'object') return {};
    const sanitized = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== null && value !== undefined && value !== '') {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * 从上下文解析物料信息
   */
  _resolveMaterial(ctx, materialId) {
    if (!ctx?.materials || !materialId) return null;
    return ctx.materials.find(m =>
      m.id == materialId || m.id === materialId || m.name === materialId
    ) || null;
  }

  /**
   * 从上下文解析供应商信息
   */
  _resolveSupplier(ctx, supplierId) {
    if (!ctx?.suppliers || !supplierId) return null;
    return ctx.suppliers.find(s =>
      s.id == supplierId || s.id === supplierId || s.name === supplierId
    ) || null;
  }

  /**
   * 质量评分转隐性成本因子
   * 5分=0%额外成本, 每降1分增加3%隐性成本
   */
  _qualityToCostFactor(score) {
    const s = typeof score === 'number' ? score : 4.5;
    return Math.max(0, (5 - s) * 0.03);
  }

  /**
   * 构建错误结果对象
   */
  _errorResult(scenarioId, message) {
    return {
      scenarioId,
      scenarioTitle: '计算错误',
      error: true,
      errorMessage: message,
      metrics: [],
      summary: {},
      sensitivity: { isSensitive: false, alerts: [] },
      computedAt: new Date().toISOString()
    };
  }
}

// ==================== 单例导出 ====================

const engine = new SimulationEngine();

if (typeof globalThis !== 'undefined') {
  globalThis.SimulationEngine = SimulationEngine;
  globalThis.simulationEngine = engine;
}

export default SimulationEngine;
export { SimulationEngine, engine };
