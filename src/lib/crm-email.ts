import 'server-only';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { EmailConfig, InsertEmailConfig, EmailTemplate, InsertEmailTemplate, EmailLog, InsertEmailLog } from '@/storage/database/shared/schema';
import nodemailer from 'nodemailer';

// ============ 邮件配置操作 ============

export async function getAllEmailConfigs(): Promise<EmailConfig[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_configs')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(`获取邮件配置失败: ${error.message}`);
  return data as EmailConfig[];
}

export async function getEmailConfigById(id: string): Promise<EmailConfig | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_configs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取邮件配置失败: ${error.message}`);
  return data as EmailConfig | null;
}

export async function getDefaultEmailConfig(): Promise<EmailConfig | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_configs')
    .select('*')
    .eq('is_default', true)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw new Error(`获取默认邮件配置失败: ${error.message}`);
  return data as EmailConfig | null;
}

export async function createEmailConfig(config: InsertEmailConfig): Promise<EmailConfig> {
  const client = getSupabaseClient();
  
  // 如果设置为默认，先取消其他默认
  if (config.is_default) {
    await client.from('email_configs').update({ is_default: false }).eq('is_default', true);
  }
  
  const { data, error } = await client
    .from('email_configs')
    .insert(config)
    .select()
    .single();
  if (error) throw new Error(`创建邮件配置失败: ${error.message}`);
  return data as EmailConfig;
}

export async function updateEmailConfig(id: string, updates: Partial<InsertEmailConfig>): Promise<EmailConfig> {
  const client = getSupabaseClient();
  
  // 如果设置为默认，先取消其他默认
  if (updates.is_default) {
    await client.from('email_configs').update({ is_default: false }).eq('is_default', true);
  }
  
  const { data, error } = await client
    .from('email_configs')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新邮件配置失败: ${error.message}`);
  return data as EmailConfig;
}

export async function deleteEmailConfig(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('email_configs')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除邮件配置失败: ${error.message}`);
}

export async function testEmailConfig(id: string, testEmail: string): Promise<{ success: boolean; message: string }> {
  const config = await getEmailConfigById(id);
  if (!config) throw new Error('邮件配置不存在');
  
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
      connectionTimeout: 10000,
    });
    
    await transporter.sendMail({
      from: `"${config.from_name}" <${config.from_email}>`,
      to: testEmail,
      subject: 'CRM 系统邮件测试',
      text: '这是一封来自 CRM 系统的测试邮件。如果收到此邮件，说明邮件配置正确。',
      html: '<p>这是一封来自 <strong>CRM 系统</strong> 的测试邮件。如果收到此邮件，说明邮件配置正确。</p>',
    });
    
    return { success: true, message: '测试邮件发送成功' };
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return { success: false, message: `测试失败: ${message}` };
  }
}

// ============ 邮件模板操作 ============

export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_templates')
    .select('*')
    .order('category')
    .order('name');
  if (error) throw new Error(`获取邮件模板失败: ${error.message}`);
  return data as EmailTemplate[];
}

export async function getActiveEmailTemplates(): Promise<EmailTemplate[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_templates')
    .select('*')
    .eq('is_active', true)
    .order('category')
    .order('name');
  if (error) throw new Error(`获取邮件模板失败: ${error.message}`);
  return data as EmailTemplate[];
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplate | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_templates')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取邮件模板失败: ${error.message}`);
  return data as EmailTemplate | null;
}

export async function getEmailTemplatesByCategory(category: string): Promise<EmailTemplate[]> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_templates')
    .select('*')
    .eq('category', category)
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(`获取邮件模板失败: ${error.message}`);
  return data as EmailTemplate[];
}

export async function createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_templates')
    .insert(template)
    .select()
    .single();
  if (error) throw new Error(`创建邮件模板失败: ${error.message}`);
  return data as EmailTemplate;
}

export async function updateEmailTemplate(id: string, updates: Partial<InsertEmailTemplate>): Promise<EmailTemplate> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_templates')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(`更新邮件模板失败: ${error.message}`);
  return data as EmailTemplate;
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client
    .from('email_templates')
    .delete()
    .eq('id', id);
  if (error) throw new Error(`删除邮件模板失败: ${error.message}`);
}

// 模板变量替换
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? variables[key] : match;
  });
}

// ============ 邮件发送与日志 ============

export interface SendEmailParams {
  configId?: string;
  templateId?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  toEmail: string;
  toName?: string;
  subject: string;
  body: string;
  variables?: Record<string, string>;
}

export async function sendEmail(params: SendEmailParams): Promise<EmailLog> {
  const client = getSupabaseClient();
  
  // 获取邮件配置
  let config: EmailConfig | null = null;
  if (params.configId) {
    config = await getEmailConfigById(params.configId);
  } else {
    config = await getDefaultEmailConfig();
  }
  
  if (!config) {
    throw new Error('没有可用的邮件配置');
  }
  
  // 如果提供了模板ID，处理模板变量替换
  let finalSubject = params.subject;
  let finalBody = params.body;
  if (params.templateId && params.variables) {
    const template = await getEmailTemplateById(params.templateId);
    if (template) {
      finalSubject = replaceTemplateVariables(template.subject, params.variables);
      finalBody = replaceTemplateVariables(template.body, params.variables);
    }
  }
  
  // 创建日志记录
  const logData: InsertEmailLog = {
    id: crypto.randomUUID(),
    config_id: config.id,
    template_id: params.templateId || null,
    entity_type: params.entityType || null,
    entity_id: params.entityId || null,
    entity_name: params.entityName || null,
    to_email: params.toEmail,
    to_name: params.toName || null,
    subject: finalSubject,
    body: finalBody,
    status: 'pending',
  };
  
  const { data: log, error: logError } = await client
    .from('email_logs')
    .insert(logData)
    .select()
    .single();
  
  if (logError) throw new Error(`创建邮件日志失败: ${logError.message}`);
  
  // 发送邮件
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.username,
        pass: config.password,
      },
      connectionTimeout: 15000,
    });
    
    await transporter.sendMail({
      from: `"${config.from_name}" <${config.from_email}>`,
      to: params.toName ? `"${params.toName}" <${params.toEmail}>` : params.toEmail,
      subject: finalSubject,
      text: finalBody.replace(/<[^>]*>/g, ''),
      html: finalBody,
    });
    
    // 更新日志状态为成功
    await client
      .from('email_logs')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .eq('id', log.id);
    
    return { ...log, status: 'sent', sent_at: new Date().toISOString() } as EmailLog;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    // 更新日志状态为失败
    await client
      .from('email_logs')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', log.id);
    
    return { ...log, status: 'failed', error_message: errorMessage } as EmailLog;
  }
}

// ============ 邮件日志查询 ============

export async function getAllEmailLogs(options?: {
  status?: string;
  entityType?: string;
  entityId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: EmailLog[]; total: number }> {
  const client = getSupabaseClient();
  
  let query = client
    .from('email_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  
  if (options?.status) {
    query = query.eq('status', options.status);
  }
  if (options?.entityType) {
    query = query.eq('entity_type', options.entityType);
  }
  if (options?.entityId) {
    query = query.eq('entity_id', options.entityId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }
  
  const { data, error, count } = await query;
  if (error) throw new Error(`获取邮件日志失败: ${error.message}`);
  
  return {
    logs: (data || []) as EmailLog[],
    total: count || 0,
  };
}

export async function getEmailLogById(id: string): Promise<EmailLog | null> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('email_logs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`获取邮件日志失败: ${error.message}`);
  return data as EmailLog | null;
}

export async function resendEmail(logId: string): Promise<EmailLog> {
  const log = await getEmailLogById(logId);
  if (!log) throw new Error('邮件日志不存在');
  
  return sendEmail({
    configId: log.config_id || undefined,
    toEmail: log.to_email,
    toName: log.to_name || undefined,
    subject: log.subject,
    body: log.body || '',
    entityType: log.entity_type || undefined,
    entityId: log.entity_id || undefined,
    entityName: log.entity_name || undefined,
  });
}

// 邮件状态统计
export async function getEmailStats(): Promise<{
  total: number;
  sent: number;
  failed: number;
  pending: number;
}> {
  const client = getSupabaseClient();
  
  const { count: total, error: totalError } = await client
    .from('email_logs')
    .select('*', { count: 'exact', head: true });
  
  const { count: sent, error: sentError } = await client
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'sent');
  
  const { count: failed, error: failedError } = await client
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');
  
  const { count: pending, error: pendingError } = await client
    .from('email_logs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  if (totalError || sentError || failedError || pendingError) {
    throw new Error('获取邮件统计失败');
  }
  
  return {
    total: total || 0,
    sent: sent || 0,
    failed: failed || 0,
    pending: pending || 0,
  };
}
