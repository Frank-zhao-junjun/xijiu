/**
 * 预警数据库操作
 * 处理预警规则和记录的持久化（使用 Supabase）
 */

import { getSupabaseClient } from '@/storage/database/supabase-client';
import type {
  AlertRule,
  AlertRecord,
  AlertStats,
  CreateAlertRuleRequest,
  UpdateAlertRuleRequest,
} from './alert-types';

// ============ 预警规则操作 ============

/**
 * 获取所有预警规则
 */
export async function getAllAlertRules(): Promise<AlertRule[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('alert_rules')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取预警规则失败: ${error.message}`);
  return data?.map(transformAlertRule) || [];
}

/**
 * 获取激活的预警规则
 */
export async function getActiveAlertRules(): Promise<AlertRule[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('alert_rules')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取激活的预警规则失败: ${error.message}`);
  return data?.map(transformAlertRule) || [];
}

/**
 * 根据ID获取预警规则
 */
export async function getAlertRuleById(id: string): Promise<AlertRule | undefined> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('alert_rules')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取预警规则失败: ${error.message}`);
  return data ? transformAlertRule(data) : undefined;
}

/**
 * 创建预警规则
 */
export async function createAlertRule(
  req: CreateAlertRuleRequest
): Promise<AlertRule> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const ruleData = {
    name: req.name,
    description: req.description,
    alert_type: req.alertType,
    target: req.target,
    condition: req.condition,
    severity: req.severity,
    is_active: req.isActive ?? true,
    notify_channels: req.notifyChannels,
    email_recipients: req.emailRecipients,
    webhook_url: req.webhookUrl,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await client
    .from('alert_rules')
    .insert(ruleData)
    .select()
    .single();
  if (error) throw new Error(`创建预警规则失败: ${error.message}`);
  return transformAlertRule(data);
}

/**
 * 更新预警规则
 */
export async function updateAlertRule(
  id: string,
  req: UpdateAlertRuleRequest
): Promise<AlertRule | null> {
  const client = getSupabaseClient();
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (req.name !== undefined) updates.name = req.name;
  if (req.description !== undefined) updates.description = req.description;
  if (req.condition !== undefined) updates.condition = req.condition;
  if (req.severity !== undefined) updates.severity = req.severity;
  if (req.isActive !== undefined) updates.is_active = req.isActive;
  if (req.notifyChannels !== undefined) updates.notify_channels = req.notifyChannels;
  if (req.emailRecipients !== undefined) updates.email_recipients = req.emailRecipients;
  if (req.webhookUrl !== undefined) updates.webhook_url = req.webhookUrl;

  const { data, error } = await client
    .from('alert_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新预警规则失败: ${error.message}`);
  return data ? transformAlertRule(data) : null;
}

/**
 * 删除预警规则
 */
export async function deleteAlertRule(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('alert_rules')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除预警规则失败: ${error.message}`);
  return true;
}

/**
 * 切换预警规则状态
 */
export async function toggleAlertRule(id: string): Promise<AlertRule | null> {
  const client = getSupabaseClient();
  const { data: existing, error: fetchError } = await client
    .from('alert_rules')
    .select('is_active')
    .eq('id', id)
    .maybeSingle();
  if (fetchError) throw new Error(`获取预警规则失败: ${fetchError.message}`);
  if (!existing) return null;

  const { data, error } = await client
    .from('alert_rules')
    .update({
      is_active: !existing.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`切换预警规则状态失败: ${error.message}`);
  return data ? transformAlertRule(data) : null;
}

// ============ 预警记录操作 ============

/**
 * 获取预警记录（带分页）
 */
export async function getAlertRecords(
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: AlertRecord[]; total: number }> {
  const client = getSupabaseClient();
  const offset = (page - 1) * pageSize;

  const { data, error, count } = await client
    .from('alert_records')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) throw new Error(`获取预警记录失败: ${error.message}`);
  return {
    data: data?.map(transformAlertRecord) || [],
    total: count || 0,
  };
}

/**
 * 获取所有预警记录
 */
export async function getAllAlertRecords(): Promise<AlertRecord[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('alert_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取预警记录失败: ${error.message}`);
  return data?.map(transformAlertRecord) || [];
}

/**
 * 根据规则ID获取预警记录
 */
export async function getAlertRecordsByRuleId(ruleId: string): Promise<AlertRecord[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('alert_records')
    .select('*')
    .eq('rule_id', ruleId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取预警记录失败: ${error.message}`);
  return data?.map(transformAlertRecord) || [];
}

/**
 * 获取未读的预警记录
 */
export async function getUnreadAlertRecords(): Promise<AlertRecord[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('alert_records')
    .select('*')
    .eq('is_read', false)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取未读预警记录失败: ${error.message}`);
  return data?.map(transformAlertRecord) || [];
}

/**
 * 创建预警记录
 */
export async function createAlertRecord(
  record: Omit<AlertRecord, 'id' | 'isRead' | 'isResolved' | 'createdAt'>
): Promise<AlertRecord> {
  const client = getSupabaseClient();
  const recordData = {
    rule_id: record.ruleId,
    rule_name: record.ruleName,
    alert_type: record.alertType,
    target: record.target,
    severity: record.severity,
    title: record.title,
    message: record.message,
    current_value: record.currentValue,
    threshold_value: record.thresholdValue,
    is_read: false,
    is_resolved: false,
    resolved_at: null,
    resolved_by: null,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await client
    .from('alert_records')
    .insert(recordData)
    .select()
    .single();
  if (error) throw new Error(`创建预警记录失败: ${error.message}`);
  return transformAlertRecord(data);
}

/**
 * 标记预警记录为已读
 */
export async function markAlertAsRead(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('alert_records')
    .update({ is_read: true })
    .eq('id', id);
  if (error) throw new Error(`标记已读失败: ${error.message}`);
  return true;
}

/**
 * 标记所有预警记录为已读
 */
export async function markAllAlertsAsRead(): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('alert_records')
    .update({ is_read: true })
    .eq('is_read', false);
  if (error) throw new Error(`标记全部已读失败: ${error.message}`);
}

/**
 * 解决预警
 */
export async function resolveAlert(
  id: string,
  resolvedBy: string
): Promise<boolean> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('alert_records')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_by: resolvedBy,
    })
    .eq('id', id);
  if (error) throw new Error(`解决预警失败: ${error.message}`);
  return true;
}

/**
 * 删除预警记录
 */
export async function deleteAlertRecord(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('alert_records')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除预警记录失败: ${error.message}`);
  return true;
}

// ============ 预警统计 ============

/**
 * 获取预警统计信息
 */
export async function getAlertStats(): Promise<AlertStats> {
  const client = getSupabaseClient();
  const now = new Date();
  const todayStartMs = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayStart = new Date(todayStartMs).toISOString();
  const weekStart = new Date(todayStartMs - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('alert_records')
    .select('*');
  if (error) throw new Error(`获取预警统计失败: ${error.message}`);

  const records = data || [];
  return {
    total: records.length,
    unread: records.filter((r) => !r.is_read).length,
    critical: records.filter((r) => r.severity === 'critical').length,
    high: records.filter((r) => r.severity === 'high').length,
    medium: records.filter((r) => r.severity === 'medium').length,
    low: records.filter((r) => r.severity === 'low').length,
    todayCount: records.filter((r) => r.created_at >= todayStart).length,
    weekCount: records.filter((r) => r.created_at >= weekStart).length,
  };
}

// ============ 数据转换函数 ============

function transformAlertRule(row: Record<string, unknown>): AlertRule {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    alertType: row.alert_type as AlertRule['alertType'],
    target: row.target as AlertRule['target'],
    condition: row.condition as AlertRule['condition'],
    severity: row.severity as AlertRule['severity'],
    isActive: row.is_active as boolean,
    notifyChannels: row.notify_channels as AlertRule['notifyChannels'],
    emailRecipients: row.email_recipients as AlertRule['emailRecipients'],
    webhookUrl: row.webhook_url as AlertRule['webhookUrl'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function transformAlertRecord(row: Record<string, unknown>): AlertRecord {
  return {
    id: row.id as string,
    ruleId: row.rule_id as string,
    ruleName: row.rule_name as string,
    alertType: row.alert_type as AlertRecord['alertType'],
    target: row.target as AlertRecord['target'],
    severity: row.severity as AlertRecord['severity'],
    title: row.title as string,
    message: row.message as string,
    currentValue: row.current_value as number | undefined,
    thresholdValue: row.threshold_value as number,
    isRead: row.is_read as boolean,
    isResolved: row.is_resolved as boolean,
    resolvedAt: row.resolved_at as string | undefined,
    resolvedBy: row.resolved_by as string | undefined,
    createdAt: row.created_at as string,
  };
}
