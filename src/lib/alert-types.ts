/**
 * 预警类型定义
 * 定义预警相关的核心类型
 */

// ============ 预警类型 ============

export type AlertType =
  | 'performance'   // 业绩预警
  | 'conversion'    // 转化率预警
  | 'customer'      // 客户预警
  | 'deal'          // 商机预警
  | 'invoice'       // 账单预警
  | 'activity';     // 活动预警

// ============ 预警级别 ============

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

// ============ 预警目标 ============

export type AlertTarget = 'sales' | 'pipeline' | 'customers' | 'deals' | 'invoices' | 'activities';

// ============ 比较运算符 ============

export type AlertOperator =
  | 'less_than'
  | 'less_than_or_equal'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'equal'
  | 'not_equal';

// ============ 监控周期 ============

export type AlertPeriod = 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

// ============ 通知渠道 ============

export type NotifyChannel = 'dashboard' | 'email' | 'sms' | 'webhook';

// ============ 预警条件 ============

export interface AlertCondition {
  metric: string;          // 指标名称
  operator: AlertOperator; // 比较运算符
  threshold: number;       // 阈值
  period: AlertPeriod;     // 统计周期
  customDays?: number;     // 自定义天数（当 period 为 custom 时）
}

// ============ 预警规则 ============

export interface AlertRule {
  id: string;
  name: string;
  description?: string;
  alertType: AlertType;
  target: AlertTarget;
  condition: AlertCondition;
  severity: AlertSeverity;
  isActive: boolean;
  notifyChannels: NotifyChannel[];
  emailRecipients?: string[];
  webhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ 预警记录 ============

export interface AlertRecord {
  id: string;
  ruleId: string;
  ruleName: string;
  alertType: AlertType;
  target: AlertTarget;
  severity: AlertSeverity;
  title: string;
  message: string;
  currentValue?: number;
  thresholdValue: number;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}

// ============ 预警统计 ============

export interface AlertStats {
  total: number;
  unread: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  todayCount: number;
  weekCount: number;
}

// ============ 预警创建请求 ============

export interface CreateAlertRuleRequest {
  name: string;
  description?: string;
  alertType: AlertType;
  target: AlertTarget;
  condition: AlertCondition;
  severity: AlertSeverity;
  isActive?: boolean;
  notifyChannels: NotifyChannel[];
  emailRecipients?: string[];
  webhookUrl?: string;
}

// ============ 预警更新请求 ============

export interface UpdateAlertRuleRequest {
  name?: string;
  description?: string;
  condition?: AlertCondition;
  severity?: AlertSeverity;
  isActive?: boolean;
  notifyChannels?: NotifyChannel[];
  emailRecipients?: string[];
  webhookUrl?: string;
}
