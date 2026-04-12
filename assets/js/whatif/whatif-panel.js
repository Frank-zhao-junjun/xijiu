/**
 * WhatIfPanel - 交互式模拟面板组件
 *
 * 功能:
 *   - 场景选择下拉菜单
 *   - 动态参数输入表单（根据场景自动渲染）
 *   - 计算执行与结果展示
 *   - ECharts 图表联动（柱状/折线/雷达）
 *
 * 设计风格: 深色科技风 (#0a0e1a 背景, Cyan #38bdf8 主色)
 */

class WhatIfPanel {
  /**
   * @param {Object} options
   * @param {HTMLElement|string} options.container 容器元素或选择器
   * @param {Object} [options.context] 业务上下文数据 { materials[], suppliers[] }
   * @param {Function} [options.onCalculate] 计算回调
   */
  constructor(options = {}) {
    this._container = typeof options.container === 'string'
      ? document.querySelector(options.container)
      : options.container;
    this._context = options.context || {};
    this._onCalculate = options.onCalculate || null;

    // 状态
    this._selectedScenarioId = null;
    this._paramValues = {};
    this._lastResult = null;
    this._chartInstance = null;

    // 颜色主题
    this._theme = {
      bg: '#0a0e1a',
      bgCard: '#111827',
      bgInput: '#1e293b',
      border: '#1e293b',
      borderActive: '#38bdf8',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      accent: '#38bdf8',       // Cyan - 主色
      accentGold: '#fbbf24',   // Gold - 强调
      success: '#22c55e',      // Green
      danger: '#ef4444',        // Red
      warning: '#f59e0b'        // Amber
    };

    if (this._container) {
      this.render();
    }
  }

  // ==================== 渲染 ====================

  /** 渲染完整面板到容器 */
  render() {
    if (!this._container) return;
    this._container.innerHTML = this._buildHTML();
    this._bindEvents();
    this._initDefaultSelection();
  }

  /** 构建面板 HTML 结构 */
  _buildHTML() {
    const scenarios = window.scenarioRegistry?.getAll() || [];
    const scenarioOptions = scenarios.map(s =>
      `<option value="${s.id}" data-icon="${s.icon || '⚙️'}">${s.icon || ''} ${s.title}</option>`
    ).join('');

    return `
<div class="whatif-panel" data-whatif="root">
  <!-- 头部 -->
  <div class="wif-header">
    <div class="wif-header-left">
      <span class="wif-icon">🔮</span>
      <h3 class="wif-title">WhatIf 模拟器</h3>
    </div>
    <div class="wif-header-right">
      <span class="wif-badge" id="wif-scenario-badge">未选择场景</span>
    </div>
  </div>

  <!-- 场景选择区 -->
  <div class="wif-section wif-scenario-select">
    <label class="wif-label">选择模拟场景</label>
    <select id="wif-scenario-select" class="wif-select">
      <option value="">-- 请选择场景 --</option>
      ${scenarioOptions}
    </select>
  </div>

  <!-- 参数配置区 -->
  <div class="wif-section wif-params" id="wif-params-section">
    <label class="wif-label">参数配置</label>
    <div id="wif-params-form" class="wif-params-form">
      <div class="wif-placeholder">请先选择一个场景</div>
    </div>
  </div>

  <!-- 操作按钮 -->
  <div class="wif-section wif-actions">
    <button id="wif-btn-calc" class="wif-btn wif-btn-primary" disabled>
      <span class="wif-btn-icon">▶</span> 运行模拟
    </button>
    <button id="wif-btn-reset" class="wif-btn wif-btn-secondary">
      ↻ 重置
    </button>
  </div>

  <!-- 结果展示区 -->
  <div class="wif-section wif-results" id="wif-results-section" style="display:none;">
    <!-- 摘要卡片 -->
    <div class="wif-summary-card" id="wif-summary-card"></div>

    <!-- 指标明细表格 -->
    <div class="wif-metrics-table-wrap">
      <h4 class="wif-subtitle">指标明细</h4>
      <table class="wif-table" id="wif-metrics-table">
        <thead><tr><th>指标</th><th>基准值</th><th>模拟值</th><th>差额</th><th>变化</th></tr></thead>
        <tbody id="wif-metrics-body"></tbody>
      </table>
    </div>

    <!-- 图表区域 -->
    <div class="wif-chart-area">
      <div class="wif-chart-tabs">
        <button class="wif-chart-tab active" data-chart="bar">柱状对比</button>
        <button class="wif-chart-tab" data-chart="line">趋势分析</button>
        <button class="wif-chart-tab" data-chart="radar">多维对比</button>
      </div>
      <div id="wif-chart-container" class="wif-chart-container"></div>
    </div>

    <!-- 敏感度告警 -->
    <div class="wif-alerts" id="wif-alerts" style="display:none;"></div>
  </div>
</div>

${this._getStyleTag()}
`;
  }

  // ==================== 样式 ====================

  /** 内联样式（深色科技风） */
  _getStyleTag() {
    const t = this._theme;
    return `
<style data-whatif="styles">
.whatif-panel { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: ${t.textPrimary}; }
.wif-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid ${t.border}; background: linear-gradient(135deg, ${t.bgCard} 0%, #0f172a 100%); border-radius: 12px 12px 0 0; }
.wif-header-left { display: flex; align-items: center; gap: 10px; }
.wif-icon { font-size: 22px; }
.wif-title { margin: 0; font-size: 18px; font-weight: 700; background: linear-gradient(90deg, ${t.accent}, ${t.accentGold}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.wif-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; background: ${t.bgInput}; color: ${t.textSecondary}; border: 1px solid ${t.border}; }

.wif-section { padding: 16px 20px; border-bottom: 1px solid ${t.border}; }
.wif-label { display: block; font-size: 13px; font-weight: 600; color: ${t.textSecondary}; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }

/* 选择框 */
.wif-select { width: 100%; padding: 10px 14px; background: ${t.bgInput}; color: ${t.textPrimary}; border: 1px solid ${t.border}; border-radius: 8px; font-size: 14px; cursor: pointer; outline: none; transition: border-color 0.2s; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2394a3b8'%3E%3Cpath d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; }
.wif-select:focus { border-color: ${t.accent}; box-shadow: 0 0 0 3px rgba(56,189,248,0.15); }
.wif-select option { background: ${t.bgCard}; color: ${t.textPrimary}; }

/* 参数表单 */
.wif-params-form { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.wif-field { display: flex; flex-direction: column; gap: 4px; }
.wif-field-label { font-size: 12px; color: ${t.textSecondary}; }
.wif-field-input { padding: 9px 12px; background: ${t.bgInput}; color: ${t.textPrimary}; border: 1px solid ${t.border}; border-radius: 6px; font-size: 14px; outline: none; transition: all 0.2s; }
.wif-field-input:focus { border-color: ${t.accent}; box-shadow: 0 0 0 2px rgba(56,189,248,0.12); }
.wif-field-input[type="range"] { padding: 0; height: 6px; cursor: pointer; accent-color: ${t.accent}; }
.wif-field-unit { font-size: 11px; color: ${t.textSecondary}; text-align: right; }
.wif-placeholder { grid-column: 1/-1; text-align: center; padding: 20px; color: ${t.textSecondary}; opacity: 0.6; font-size: 13px; }

/* 按钮 */
.wif-actions { display: flex; gap: 10px; }
.wif-btn { flex: 1; padding: 12px 20px; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
.wif-btn-primary { background: linear-gradient(135deg, ${t.accent}, #0ea5e9); color: #fff; }
.wif-btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(56,189,248,0.35); }
.wif-btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.wif-btn-secondary { background: transparent; color: ${t.textSecondary}; border: 1px solid ${t.border}; }
.wif-btn-secondary:hover { border-color: ${t.textSecondary}; color: ${t.textPrimary}; }

/* 结果区 */
.wif-summary-card { background: linear-gradient(135deg, rgba(56,189,248,0.08), rgba(251,191,36,0.05)); border: 1px solid rgba(56,189,248,0.2); border-radius: 10px; padding: 16px 20px; margin-bottom: 16px; }
.wif-summary-headline { font-size: 15px; font-weight: 600; margin-bottom: 10px; }
.wif-summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.wif-summary-item { text-align: center; }
.wif-summary-value { font-size: 18px; font-weight: 700; }
.wif-summary-label { font-size: 11px; color: ${t.textSecondary}; margin-top: 2px; }

/* 表格 */
.wif-subtitle { font-size: 14px; font-weight: 600; margin: 0 0 10px; color: ${t.textPrimary}; }
.wif-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.wif-table th { padding: 10px 12px; text-align: left; background: ${t.bgInput}; color: ${t.textSecondary}; font-weight: 600; border-bottom: 1px solid ${t.border}; }
.wif-table td { padding: 10px 12px; border-bottom: 1px solid ${t.border}; }
.wif-table tr:hover td { background: rgba(56,189,248,0.04); }
.wif-delta-up { color: ${t.danger}; font-weight: 600; }
.wif-delta-down { color: ${t.success}; font-weight: 600; }
.wif-pct-tag { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; font-weight: 600; }

/* 图表 */
.wif-chart-area { margin-top: 16px; }
.wif-chart-tabs { display: flex; gap: 4px; margin-bottom: 12px; }
.wif-chart-tab { padding: 6px 16px; background: transparent; border: 1px solid ${t.border}; border-radius: 6px; color: ${t.textSecondary}; font-size: 12px; cursor: pointer; transition: all 0.2s; }
.wif-chart-tab.active { background: ${t.accent}; color: #fff; border-color: ${t.accent}; }
.wif-chart-tab:hover:not(.active) { border-color: ${t.accent}; color: ${t.accent}; }
.wif-chart-container { height: 280px; background: ${t.bgCard}; border: 1px solid ${t.border}; border-radius: 8px; padding: 12px; }

/* 告警 */
.wif-alerts { margin-top: 12px; }
.wif-alert-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 6px; font-size: 12px; margin-bottom: 6px; }
.wif-alert-high { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.25); color: #fca5a5; }
.wif-alert-medium { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25); color: #fcd34d; }
.wif-alert-low { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25); color: #93c5fd; }

/* 动画 */
@keyframes wif-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
#wif-results-section { animation: wif-fadeIn 0.35s ease-out; }
</style>`;
  }

  // ==================== 事件绑定 ====================

  _bindEvents() {
    const root = this._container;

    // 场景选择变化
    root.querySelector('#wif-scene-select')?.addEventListener('change', (e) => {
      this._onScenarioChange(e.target.value);
    });

    // 运行按钮
    root.querySelector('#wif-btn-calc')?.addEventListener('click', () => {
      this._runCalculation();
    });

    // 重置按钮
    root.querySelector('#wif-btn-reset')?.addEventListener('click', () => {
      this.reset();
    });

    // 图表 Tab 切换
    root.querySelectorAll('.wif-chart-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        root.querySelectorAll('.wif-chart-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this._renderChart(e.target.dataset.chart);
      });
    });
  }

  // ==================== 场景切换逻辑 ====================

  _onScenarioChange(scenarioId) {
    this._selectedScenarioId = scenarioId || null;
    this._paramValues = {};

    // 更新 badge
    const badge = this._container.querySelector('#wif-scenario-badge');
    if (badge) {
      if (scenarioId) {
        const sc = window.scenarioRegistry?.getById(scenarioId);
        badge.textContent = sc?.title || scenarioId;
        badge.style.borderColor = this._theme.accent;
        badge.style.color = this._theme.accent;
      } else {
        badge.textContent = '未选择场景';
        badge.style.borderColor = '';
        badge.style.color = '';
      }
    }

    // 渲染参数表单
    this._renderParamsForm(scenarioId);

    // 启用/禁用计算按钮
    const btn = this._container.querySelector('#wif-btn-calc');
    if (btn) btn.disabled = !scenarioId;

    // 隐藏结果区
    this._hideResults();
  }

  /** 渲染动态参数表单 */
  _renderParamsForm(scenarioId) {
    const formEl = this._container.querySelector('#wif-params-form');
    if (!formEl) return;

    if (!scenarioId) {
      formEl.innerHTML = '<div class="wif-placeholder">请先选择一个场景</div>';
      return;
    }

    const scenario = window.scenarioRegistry?.getById(scenarioId);
    if (!scenario?.params?.length) {
      formEl.innerHTML = '<div class="wif-placeholder">该场景无需额外参数</div>';
      return;
    }

    let html = '';
    scenario.params.forEach(param => {
      const val = param.defaultValue ?? '';
      const required = param.required ? '<span style="color:#ef4444">*</span>' : '';

      html += `<div class="wif-field">`;
      html += `<label class="wif-field-label">${required}${param.label}</label>`;

      switch (param.type) {
        case 'slider':
          html += `<input type="range" class="wif-field-input" data-param="${param.key}"
            min="${param.min ?? 0}" max="${param.max ?? 100}" step="${param.step ?? 1}"
            value="${val}" />`;
          break;
        case 'select':
          html += `<select class="wif-field-input wif-select" data-param="${param.key}">
            <option value="">-- 请选择 --</option>`;
          (param.options || []).forEach(opt => {
            const optVal = typeof opt === 'object' ? (opt.value || opt.id || '') : opt;
            const optLabel = typeof opt === 'object' ? (opt.label || opt.name || opt) : opt;
            html += `<option value="${optVal}">${optLabel}</option>`;
          });
          html += `</select>`;
          break;
        default:
          html += `<input type="${param.type === 'number' ? 'number' : 'text'}"
            class="wif-field-input" data-param="${param.key}"
            value="${val}"
            ${param.min !== undefined ? `min="${param.min}"` : ''}
            ${param.max !== undefined ? `max="${param.max}"` : ''}
            ${param.step !== undefined ? `step="${param.step}"` : ''}
            placeholder="${param.placeholder || ''}" />`;
      }

      if (param.unit) {
        html += `<span class="wif-field-unit">${param.unit}</span>`;
      }
      html += `</div>`;
    });

    formEl.innerHTML = html;

    // 绑定参数值变更事件
    formEl.querySelectorAll('[data-param]').forEach(input => {
      input.addEventListener('input', () => {
        this._collectParamValues();
      });
      input.addEventListener('change', () => {
        this._collectParamValues();
      });
    });
  }

  _initDefaultSelection() {
    const select = this._container.querySelector('#wif-scene-select');
    if (select && select.options.length > 1) {
      // 默认选中第一个场景
      select.value = select.options[1].value;
      this._onScenarioChange(select.value);
    }
  }

  // ==================== 计算执行 ====================

  _collectParamValues() {
    this._paramValues = {};
    this._container.querySelectorAll('#wif-params-form [data-param]').forEach(input => {
      let val = input.value;
      if (input.type === 'number' || input.type === 'range') {
        val = parseFloat(val) || 0;
      }
      this._paramValues[input.dataset.param] = val;
    });
  }

  async _runCalculation() {
    if (!this._selectedScenarioId) return;

    this._collectParamValues();

    const btn = this._container.querySelector('#wif-btn-calc');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span>⏳</span> 计算中...';
    }

    try {
      // 执行计算
      const engine = window.simulationEngine;
      const rawResult = engine.calculate(this._selectedScenarioId, this._paramValues, this._context);

      // 格式化结果
      const formatter = window.formatter;
      this._lastResult = formatter.formatResult(rawResult);

      // 回调
      if (this._onCalculate) {
        this._onCalculate(this._lastResult);
      }

      // 渲染结果
      this._showResults(this._lastResult);

    } catch (err) {
      console.error('[WhatIfPanel] 计算错误:', err);
      this._showError(err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="wif-btn-icon">▶</span> 运行模拟';
      }
    }
  }

  // ==================== 结果渲染 ====================

  _showResults(formatted) {
    const section = this._container.querySelector('#wif-results-section');
    if (!section) return;
    section.style.display = 'block';

    // 摘要卡片
    this._renderSummary(formatted);

    // 指标表格
    this._renderMetricsTable(formatted.metrics);

    // 默认图表
    this._renderChart('bar');

    // 敏感度告警
    this._renderAlerts(formatted.sensitivity);

    // 滚动到结果区
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  _renderSummary(f) {
    const card = this._container.querySelector('#wif-summary-card');
    if (!card) return;

    card.innerHTML = `
      <div class="wif-summary-headline" style="color:${f.summary.totalPercentColor}">${f.headline}</div>
      <div class="wif-summary-grid">
        <div class="wif-summary-item"><div class="wif-summary-value" style="color:${this._theme.textPrimary}">${f.summary.totalOriginal}</div><div class="wif-summary-label">基准总成本</div></div>
        <div class="wif-summary-item"><div class="wif-summary-value" style="color:${this._theme.accent}">${f.summary.totalSimulated}</div><div class="wif-summary-label">模拟总成本</div></div>
        <div class="wif-summary-item"><div class="wif-summary-value" style="color:${f.summary.totalPercentColor}">${f.summary.totalDelta}${f.summary.totalArrow}</div><div class="wif-summary-label">差额</div></div>
        <div class="wif-summary-item"><div class="wif-summary-value" style="color:${f.summary.totalPercentColor}">${f.summary.totalPercentChange}</div><div class="wif-summary-label">变化幅度</div></div>
      </div>`;
  }

  _renderMetricsTable(metrics) {
    const tbody = this._container.querySelector('#wif-metrics-body');
    if (!tbody) return;

    tbody.innerHTML = metrics.map(m => {
      const deltaClass = m.deltaRaw > 0 ? 'wif-delta-up' : m.deltaRaw < 0 ? 'wif-delta-down' : '';
      const sign = m.deltaRaw > 0 ? '+' : '';
      return `<tr>
        <td>${m.name}</td>
        <td>${m.originalValue}</td>
        <td style="color:${this._theme.accent}">${m.simulatedValue}</td>
        <td class="${deltaClass}">${sign}${m.delta}</td>
        <td><span class="wif-pct-tag" style="background:${m.percentColor}22;color:${m.percentColor}">${m.arrow} ${m.percentChange}</span></td>
      </tr>`;
    }).join('');
  }

  _renderChart(chartType) {
    const container = this._container.querySelector('#wif-chart-container');
    if (!container || !this._lastResult) return;

    // 如果 ECharts 未加载，显示提示
    if (typeof echarts === 'undefined') {
      container.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:${this._theme.textSecondary};font-size:13px;">图表需要 ECharts 库支持</div>`;
      return;
    }

    // 销毁旧实例
    if (this._chartInstance) {
      this._chartInstance.dispose();
    }

    this._chartInstance = echarts.init(container);
    const formatter = window.formatter;
    const raw = this._lastResult; // 这里需要原始 result，暂用 formatted 的数据重建

    let option = {};

    switch (chartType) {
      case 'bar':
        option = this._buildBarOption();
        break;
      case 'line':
        option = this._buildLineOption();
        break;
      case 'radar':
        option = this._buildRadarOption();
        break;
    }

    option.backgroundColor = 'transparent';
    option.textStyle = { color: this._theme.textSecondary };
    this._chartInstance.setOption(option, true);

    // 响应式
    setTimeout(() => this._chartInstance?.resize(), 50);
  }

  _buildBarOption() {
    const metrics = this._lastResult?.metrics || [];
    return {
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
      legend: { data: ['基准值', '模拟值'], textStyle: { color: '#94a3b8' }, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
      xAxis: { type: 'category', data: metrics.map(m => m.name), axisLabel: { color: '#94a3b8', fontSize: 11 }, axisLine: { lineStyle: { color: '#1e293b' } } },
      yAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [
        { name: '基准值', type: 'bar', data: metrics.map(m => ({ value: m.deltaRaw !== undefined ? (m.originalValue.replace(/[^\d.-]/g, '') || 0) : 0, itemStyle: { color: '#64748b', borderRadius: [4, 4, 0, 0] } })) },
        { name: '模拟值', type: 'bar', data: metrics.map(m => ({ value: m.deltaRaw !== undefined ? (m.simulatedValue.replace(/[^\d.-]/g, '') || 0) : 0, itemStyle: { color: '#38bdf8', borderRadius: [4, 4, 0, 0] } })) }
      ]
    };
  }

  _buildLineOption() {
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    const summary = this._lastResult?.summary || {};
    const baseTotal = parseFloat(summary.totalOriginal?.replace(/[^\d.-]/g, '')) || 0;
    const pct = parseFloat(summary.totalPercentChange?.replace(/[^\d.-]/g, '')) || 0;
    const monthlyBase = baseTotal / 12;

    return {
      tooltip: { trigger: 'axis', backgroundColor: '#1e293b', borderColor: '#334155', textStyle: { color: '#f1f5f9' } },
      legend: { data: ['基准线', '模拟线'], textStyle: { color: '#94a3b8' }, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
      xAxis: { type: 'category', data: months, axisLabel: { color: '#94a3b8' }, boundaryGap: false },
      yAxis: { type: 'value', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
      series: [
        { name: '基准线', type: 'line', data: months.map(() => monthlyBase), lineStyle: { color: '#64748b', type: 'dashed' }, itemStyle: { color: '#64748b' }, symbol: 'none' },
        { name: '模拟线', type: 'line', data: months.map((_, i) => monthlyBase * (1 + pct / 100 * ((i + 1) / 12))), lineStyle: { color: '#38bdf8', width: 2.5 }, itemStyle: { color: '#38bdf8' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(56,189,248,0.2)' }, { offset: 1, color: 'rgba(56,189,248,0)' }] } }, smooth: true }
      ]
    };
  }

  _buildRadarOption() {
    const metrics = this._lastResult?.metrics || [];
    const indicators = metrics.map(m => ({ name: m.name, max: 100 }));
    const normalize = (strVal) => Math.abs(parseFloat(String(strVal).replace(/[^\d.-]/g, '')) || 0);

    return {
      tooltip: {},
      radar: { indicator: indicators, shape: 'polygon', axisName: { color: '#94a3b8' }, splitArea: { areaStyle: { color: ['rgba(56,189,248,0.02)', 'rgba(56,189,248,0.05)'] } }, splitLine: { lineStyle: { color: '#1e293b' } } },
      legend: { data: ['基准方案', '模拟方案'], textStyle: { color: '#94a3b8' }, top: 0 },
      series: [{
        type: 'radar',
        data: [
          { name: '基准方案', value: metrics.map(m => normalize(m.originalValue)), lineStyle: { color: '#ef4444' }, areaStyle: { color: 'rgba(239,68,68,0.1)' } },
          { name: '模拟方案', value: metrics.map(m => normalize(m.simulatedValue)), lineStyle: { color: '#22c55e' }, areaStyle: { color: 'rgba(34,197,94,0.1)' } }
        ]
      }]
    };
  }

  _renderAlerts(sensitivity) {
    const el = this._container.querySelector('#wif-alerts');
    if (!el) return;

    if (!sensitivity?.isSensitive || !sensitivity.alerts?.length) {
      el.style.display = 'none';
      return;
    }

    el.style.display = 'block';
    el.innerHTML = `<h4 class="wif-subtitle" style="margin-bottom:8px;">敏感度告警 (${sensitivity.alertCount})</h4>` +
      sensitivity.alerts.map(a => `<div class="wif-alert-item wif-alert-${a.level}">${a.message}</div>`).join('');
  }

  _hideResults() {
    const section = this._container.querySelector('#wif-results-section');
    if (section) section.style.display = 'none';
  }

  _showError(msg) {
    const section = this._container.querySelector('#wif-results-section');
    if (!section) return;
    section.style.display = 'block';
    section.innerHTML = `<div style="padding:30px;text-align:center;color:#ef4444;">计算出错: ${msg}</div>`;
  }

  // ==================== 公共 API ====================

  /** 重置面板状态 */
  reset() {
    this._paramValues = {};
    this._lastResult = null;
    this._hideResults();

    // 重置参数表单为默认值
    if (this._selectedScenarioId) {
      this._renderParamsForm(this._selectedScenarioId);
    }
  }

  /** 设置业务上下文数据 */
  setContext(ctx) {
    this._context = ctx || {};
    // 刷新选项类参数
    if (this._selectedScenarioId) {
      this._renderParamsForm(this._selectedScenarioId);
    }
  }

  /** 获取最后一次计算结果 */
  getLastResult() {
    return this._lastResult;
  }

  /** 手动触发计算 */
  calculate(scenarioId, params) {
    if (scenarioId) this._selectedScenarioId = scenarioId;
    if (params) this._paramValues = params;
    this._runCalculation();
  }

  /** 调整图表大小（响应式） */
  resize() {
    this._chartInstance?.resize();
  }
}

// ==================== 导出 ====================
if (typeof globalThis !== 'undefined') {
  globalThis.WhatIfPanel = WhatIfPanel;
}
export default WhatIfPanel;
export { WhatIfPanel };
