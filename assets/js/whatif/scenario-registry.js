/**
 * ScenarioRegistry - WhatIf 场景注册表
 * 管理所有模拟场景的定义和元数据
 *
 * 内置场景:
 *   1. price-change    - 价格变动模拟
 *   2. supplier-switch - 供应商切换模拟
 *   3. bulk-purchase   - 批量采购模拟
 */

class ScenarioRegistry {
  constructor() {
    /** @type {Map<string, Scenario>} 场景ID -> 场景定义 */
    this._scenarios = new Map();
    this._registerBuiltInScenarios();
  }

  // ==================== 公共 API ====================

  /**
   * 注册一个新场景
   * @param {Scenario} scenario 场景定义对象
   * @throws {Error} 如果场景ID已存在或参数无效
   */
  register(scenario) {
    if (!scenario || typeof scenario !== 'object') {
      throw new Error('[ScenarioRegistry] scenario 必须为非空对象');
    }
    if (!scenario.id || typeof scenario.id !== 'string') {
      throw new Error('[ScenarioRegistry] scenario.id 必须为非空字符串');
    }
    if (this._scenarios.has(scenario.id)) {
      throw new Error(`[ScenarioRegistry] 场景ID "${scenario.id}" 已存在，不可重复注册`);
    }

    // 校验必填字段
    const requiredFields = ['title', 'category', 'description', 'params'];
    for (const field of requiredFields) {
      if (!(field in scenario)) {
        throw new Error(`[ScenarioRegistry] 缺少必填字段: ${field}`);
      }
    }

    // 设置默认值
    const normalized = {
      icon: '⚙️',
      priority: 50,
      enabled: true,
      ...scenario,
      registeredAt: new Date().toISOString()
    };

    this._scenarios.set(normalized.id, normalized);
  }

  /**
   * 获取所有已注册场景（按优先级排序）
   * @returns {Scenario[]}
   */
  getAll() {
    return Array.from(this._scenarios.values())
      .filter(s => s.enabled)
      .sort((a, b) => (a.priority || 50) - (b.priority || 50));
  }

  /**
   * 按ID获取单个场景
   * @param {string} id 场景ID
   * @returns {Scenario|null}
   */
  getById(id) {
    return this._scenarios.get(id) || null;
  }

  /**
   * 按分类获取场景列表
   * @param {string} category 分类名称
   * @returns {Scenario[]}
   */
  getByCategory(category) {
    return this.getAll().filter(s => s.category === category);
  }

  /**
   * 获取所有分类
   * @returns {string[]}
   */
  getCategories() {
    const cats = new Set(this.getAll().map(s => s.category));
    return Array.from(cats);
  }

  /**
   * 获取已注册场景总数
   * @returns {number}
   */
  get count() {
    return this._scenarios.size;
  }

  // ==================== 内置场景注册 ====================

  _registerBuiltInScenarios() {
    // 场景1: 价格变动模拟
    this.register({
      id: 'price-change',
      title: '价格变动分析',
      category: '成本优化',
      description: '模拟原料单价变动对采购总成本的影响，支持涨跌幅度和影响范围配置',
      icon: '📊',
      priority: 10,
      params: [
        {
          key: 'materialId',
          label: '目标物料',
          type: 'select',
          defaultValue: '',
          required: true,
          options: []  // 运行时由外部注入
        },
        {
          key: 'priceChangePercent',
          label: '价格变动幅度(%)',
          type: 'number',
          defaultValue: 10,
          min: -50,
          max: 100,
          step: 1,
          unit: '%'
        },
        {
          key: 'affectedMonths',
          label: '影响月数',
          type: 'number',
          defaultValue: 12,
          min: 1,
          max: 36,
          step: 1,
          unit: '个月'
        },
        {
          key: 'volumeAssumption',
          label: '月均采购量假设(吨)',
          type: 'number',
          defaultValue: 100,
          min: 1,
          step: 1,
          unit: '吨'
        }
      ],
      metadata: {
        sensitivityRange: [-30, 50],
        defaultChartType: 'line',
        impactDimension: 'cost'
      }
    });

    // 场景2: 供应商切换模拟
    this.register({
      id: 'supplier-switch',
      title: '供应商切换评估',
      category: '风险管理',
      description: '对比当前供应商与候选供应商的综合成本差异，含价格、交期、质量多维对比',
      icon: '🔄',
      priority: 20,
      params: [
        {
          key: 'currentSupplierId',
          label: '当前供应商',
          type: 'select',
          defaultValue: '',
          required: true,
          options: []
        },
        {
          key: 'candidateSupplierId',
          label: '候选供应商',
          type: 'select',
          defaultValue: '',
          required: true,
          options: []
        },
        {
          key: 'annualVolume',
          label: '年采购量(吨)',
          type: 'number',
          defaultValue: 1200,
          min: 100,
          step: 100,
          unit: '吨'
        },
        {
          key: 'evaluationPeriod',
          label: '评估周期(月)',
          type: 'number',
          defaultValue: 12,
          min: 3,
          max: 24,
          step: 3,
          unit: '个月'
        }
      ],
      metadata: {
        comparisonDimensions: ['price', 'quality', 'delivery', 'service'],
        defaultChartType: 'radar',
        impactDimension: 'total_cost'
      }
    });

    // 场景3: 批量采购模拟
    this.register({
      id: 'bulk-purchase',
      title: '批量采购策略',
      category: '成本优化',
      description: '模拟不同采购批量和频次对库存成本、资金占用、议价能力的影响',
      icon: '📦',
      priority: 30,
      params: [
        {
          key: 'materialId',
          label: '目标物料',
          type: 'select',
          defaultValue: '',
          required: true,
          options: []
        },
        {
          key: 'baseOrderQty',
          label: '基准单次采购量(吨)',
          type: 'number',
          defaultValue: 50,
          min: 10,
          step: 10,
          unit: '吨'
        },
        {
          key: 'bulkMultiplier',
          label: '批量倍数',
          type: 'slider',
          defaultValue: 2,
          min: 1,
          max: 5,
          step: 0.5,
          unit: '倍'
        },
        {
          key: 'discountRate',
          label: '批量折扣率(%)',
          type: 'number',
          defaultValue: 5,
          min: 0,
          max: 20,
          step: 0.5,
          unit: '%'
        },
        {
          key: 'holdingCostRate',
          label: '库存持有成本率(%/年)',
          type: 'number',
          defaultValue: 15,
          min: 5,
          max: 30,
          step: 1,
          unit: '%'
        }
      ],
      metadata: {
        outputMetrics: ['total_cost', 'inventory_cost', 'cash_tied', 'savings'],
        defaultChartType: 'bar',
        impactDimension: 'total_savings'
      }
    });
  }
}

// ==================== 单例导出 ====================

/** 全局唯一实例 */
const registry = new ScenarioRegistry();

// 同时支持类和实例两种使用方式
if (typeof globalThis !== 'undefined') {
  globalThis.ScenarioRegistry = ScenarioRegistry;
  globalThis.scenarioRegistry = registry;
}

// ES Module 导出兼容
export default ScenarioRegistry;
export { ScenarioRegistry, registry };
