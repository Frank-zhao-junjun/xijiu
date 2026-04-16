/**
 * 预警规则配置
 * 定义预警规则类型、预定义规则模板和规则验证
 */

import type { AlertRule, AlertType, AlertSeverity } from './alert-types';

// ============ 预警规则模板 ============

export const ALERT_RULE_TEMPLATES: AlertRule[] = [
  {
    id: 'template-performance-low',
    name: '业绩低于阈值',
    description: '当销售业绩低于设定的阈值时触发预警',
    alertType: 'performance',
    target: 'sales',
    condition: {
      metric: 'revenue',
      operator: 'less_than',
      threshold: 10000,
      period: 'day',
    },
    severity: 'high',
    isActive: true,
    notifyChannels: ['dashboard', 'email'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-conversion-drop',
    name: '转化率下降',
    description: '当客户转化率下降到低于阈值时触发',
    alertType: 'conversion',
    target: 'pipeline',
    condition: {
      metric: 'conversion_rate',
      operator: 'less_than',
      threshold: 0.1,
      period: 'week',
    },
    severity: 'medium',
    isActive: true,
    notifyChannels: ['dashboard'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-customer-lost',
    name: '客户流失预警',
    description: '当客户超过指定天数未互动时触发预警',
    alertType: 'customer',
    target: 'customers',
    condition: {
      metric: 'inactivity_days',
      operator: 'greater_than',
      threshold: 30,
      period: 'custom',
    },
    severity: 'high',
    isActive: true,
    notifyChannels: ['dashboard', 'email'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-deal-stale',
    name: '商机停滞预警',
    description: '当商机在当前阶段停留时间超过阈值时触发',
    alertType: 'deal',
    target: 'deals',
    condition: {
      metric: 'stage_days',
      operator: 'greater_than',
      threshold: 14,
      period: 'day',
    },
    severity: 'medium',
    isActive: true,
    notifyChannels: ['dashboard'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-invoice-overdue',
    name: '账单逾期预警',
    description: '当账单逾期超过指定天数时触发预警',
    alertType: 'invoice',
    target: 'invoices',
    condition: {
      metric: 'overdue_days',
      operator: 'greater_than',
      threshold: 7,
      period: 'day',
    },
    severity: 'critical',
    isActive: true,
    notifyChannels: ['dashboard', 'email'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ============ 预警类型配置 ============

export const ALERT_TYPE_CONFIG: Record<AlertType, { label: string; icon: string; color: string }> = {
  performance: { label: '业绩', icon: '📊', color: 'blue' },
  conversion: { label: '转化率', icon: '📈', color: 'green' },
  customer: { label: '客户', icon: '👥', color: 'purple' },
  deal: { label: '商机', icon: '💼', color: 'yellow' },
  invoice: { label: '账单', icon: '📄', color: 'red' },
  activity: { label: '活动', icon: '🔔', color: 'cyan' },
};

// ============ 预警级别配置 ============

export const ALERT_SEVERITY_CONFIG: Record<AlertSeverity, { label: string; color: string; priority: number }> = {
  critical: { label: '紧急', color: 'red', priority: 1 },
  high: { label: '高', color: 'orange', priority: 2 },
  medium: { label: '中', color: 'yellow', priority: 3 },
  low: { label: '低', color: 'blue', priority: 4 },
};

// ============ 通知渠道配置 ============

export const NOTIFY_CHANNEL_CONFIG: Record<string, { label: string; icon: string }> = {
  dashboard: { label: '仪表盘', icon: '📱' },
  email: { label: '邮件', icon: '📧' },
  sms: { label: '短信', icon: '💬' },
  webhook: { label: 'Webhook', icon: '🔗' },
};

// ============ 规则验证函数 ============

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * 验证预警规则配置
 */
export function validateAlertRule(rule: Partial<AlertRule>): ValidationResult {
  const errors: string[] = [];

  if (!rule.name || rule.name.trim().length === 0) {
    errors.push('规则名称不能为空');
  }

  if (rule.name && rule.name.length > 100) {
    errors.push('规则名称不能超过100个字符');
  }

  if (!rule.alertType) {
    errors.push('必须选择预警类型');
  }

  if (!rule.target) {
    errors.push('必须选择预警目标');
  }

  if (!rule.condition) {
    errors.push('必须配置触发条件');
  } else {
    if (!rule.condition.metric) {
      errors.push('必须选择监控指标');
    }
    if (!rule.condition.operator) {
      errors.push('必须选择比较运算符');
    }
    if (rule.condition.threshold === undefined || rule.condition.threshold === null) {
      errors.push('必须设置阈值');
    }
  }

  if (rule.severity && !['critical', 'high', 'medium', 'low'].includes(rule.severity)) {
    errors.push('预警级别必须是 critical/high/medium/low 之一');
  }

  if (rule.notifyChannels && !Array.isArray(rule.notifyChannels)) {
    errors.push('通知渠道必须是数组');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 获取有效的运算符列表
 */
export function getOperatorsForMetric(metric: string): { value: string; label: string }[] {
  const numericOperators = [
    { value: 'less_than', label: '小于' },
    { value: 'less_than_or_equal', label: '小于等于' },
    { value: 'greater_than', label: '大于' },
    { value: 'greater_than_or_equal', label: '大于等于' },
    { value: 'equal', label: '等于' },
    { value: 'not_equal', label: '不等于' },
  ];

  const percentageOperators = [
    { value: 'less_than', label: '低于' },
    { value: 'greater_than', label: '高于' },
  ];

  const metricOperators: Record<string, typeof numericOperators> = {
    revenue: numericOperators,
    conversion_rate: percentageOperators,
    inactivity_days: numericOperators,
    stage_days: numericOperators,
    overdue_days: numericOperators,
    deal_value: numericOperators,
    activity_count: numericOperators,
  };

  return metricOperators[metric] || numericOperators;
}

/**
 * 获取指标对应的周期选项
 */
export function getPeriodsForMetric(metric: string): { value: string; label: string }[] {
  const defaultPeriods = [
    { value: 'day', label: '每天' },
    { value: 'week', label: '每周' },
    { value: 'month', label: '每月' },
  ];

  const shortPeriods = [
    { value: 'hour', label: '每小时' },
    { value: 'day', label: '每天' },
  ];

  const metricPeriods: Record<string, typeof defaultPeriods> = {
    revenue: defaultPeriods,
    conversion_rate: defaultPeriods,
    inactivity_days: defaultPeriods,
    stage_days: shortPeriods,
    overdue_days: shortPeriods,
  };

  return metricPeriods[metric] || defaultPeriods;
}

/**
 * 创建新规则（使用模板或自定义）
 */
export function createRuleFromTemplate(
  templateId: string,
  overrides: Partial<AlertRule> = {}
): AlertRule | null {
  const template = ALERT_RULE_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return null;

  const newRule: AlertRule = {
    ...template,
    id: `rule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...overrides,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return newRule;
}
