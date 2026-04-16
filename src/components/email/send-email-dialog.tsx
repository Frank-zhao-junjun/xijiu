'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Send, Variable } from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string;
  category: string;
  is_active?: boolean;
}

interface SendEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'customer' | 'contact' | 'lead' | 'opportunity';
  entityId: string;
  entityName: string;
  toEmail: string;
  toName?: string;
}

export function SendEmailDialog({
  open,
  onOpenChange,
  entityType,
  entityId,
  entityName,
  toEmail,
  toName,
}: SendEmailDialogProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const [formData, setFormData] = useState({
    to_email: '',
    to_name: '',
    subject: '',
    body: '',
  });

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emails/templates');
      if (response.ok) {
        const data = await response.json();
        // 筛选相关分类的模板
        const filteredTemplates = data.filter(
          (t: EmailTemplate) =>
            t.category === entityType || t.category === 'general' || t.is_active
        );
        setTemplates(filteredTemplates);
      }
    } catch (error) {
      console.error('获取模板失败:', error);
    } finally {
      setLoading(false);
    }
  }, [entityType]);

  useEffect(() => {
    if (open) {
      void fetchTemplates();
      setFormData({
        to_email: toEmail,
        to_name: toName || '',
        subject: '',
        body: '',
      });
      setSelectedTemplate(null);
    }
  }, [open, toEmail, toName, fetchTemplates]);

  const handleSelectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    const variables = JSON.parse(template.variables || '[]');
    
    // 准备变量值
    const variableValues: Record<string, string> = {};
    variables.forEach((v: string) => {
      switch (v) {
        case 'customer_name':
        case 'contact_name':
          variableValues[v] = toName || entityName;
          break;
        case 'contact_email':
          variableValues[v] = toEmail;
          break;
        case 'opportunity_name':
          variableValues[v] = entityType === 'opportunity' ? entityName : '';
          break;
        case 'current_date':
          variableValues[v] = new Date().toLocaleDateString('zh-CN');
          break;
        default:
          variableValues[v] = '';
      }
    });

    // 替换变量
    let subject = template.subject;
    let body = template.body;
    Object.entries(variableValues).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value || `{{${key}}}`);
    });

    setFormData({
      ...formData,
      to_email: toEmail,
      to_name: toName || '',
      subject,
      body,
    });
  };

  const handleSend = async () => {
    if (!formData.to_email) {
      toast.error('请输入收件人邮箱');
      return;
    }
    if (!formData.subject) {
      toast.error('请输入邮件主题');
      return;
    }

    setSending(true);
    try {
      const response = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          entity_name: entityName,
          to_email: formData.to_email,
          to_name: formData.to_name,
          subject: formData.subject,
          body: formData.body,
          template_id: selectedTemplate?.id,
          variables: selectedTemplate ? JSON.parse(selectedTemplate.variables || '[]') : [],
        }),
      });

      if (response.ok) {
        toast.success('邮件发送成功');
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || '发送失败');
      }
    } catch (error) {
      console.error('发送邮件失败:', error);
      toast.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  const previewContent = () => {
    if (!formData.body) return '';
    return formData.body;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            发送邮件
          </DialogTitle>
          <DialogDescription>
            发送给 {entityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 模板选择 */}
          {!previewMode && (
            <div className="space-y-2">
              <Label>选择模板 (可选)</Label>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : templates.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {templates.map((template) => (
                    <Badge
                      key={template.id}
                      variant={selectedTemplate?.id === template.id ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleSelectTemplate(template)}
                    >
                      {template.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无可用模板</p>
              )}
            </div>
          )}

          {/* 收件人 */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="to_email">收件人邮箱 *</Label>
              <Input
                id="to_email"
                type="email"
                placeholder="recipient@example.com"
                value={formData.to_email}
                onChange={(e) => setFormData({ ...formData, to_email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to_name">收件人姓名</Label>
              <Input
                id="to_name"
                placeholder="收件人姓名"
                value={formData.to_name}
                onChange={(e) => setFormData({ ...formData, to_name: e.target.value })}
              />
            </div>
          </div>

          {/* 主题 */}
          <div className="space-y-2">
            <Label htmlFor="subject">邮件主题 *</Label>
            <Input
              id="subject"
              placeholder="请输入邮件主题"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>

          {/* 内容 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="body">邮件内容</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? '编辑' : '预览'}
              </Button>
            </div>
            {previewMode ? (
              <div
                className="p-4 min-h-[200px] bg-muted rounded-lg prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewContent() || '<p class="text-muted-foreground">无内容</p>' }}
              />
            ) : (
              <Textarea
                id="body"
                placeholder="请输入邮件内容 (支持 HTML)"
                className="min-h-[200px] font-mono text-sm"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              />
            )}
          </div>

          {/* 变量提示 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Variable className="h-4 w-4" />
            <span>使用 {'{{变量名}}'} 格式添加变量，选择模板后自动替换</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                发送中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                发送邮件
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
