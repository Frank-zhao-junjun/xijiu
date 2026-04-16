'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Loader2,
  FileText,
  Tag,
  Variable,
  Copy,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const TEMPLATE_CATEGORIES = [
  { value: 'general', label: '通用' },
  { value: 'customer', label: '客户' },
  { value: 'lead', label: '销售线索' },
  { value: 'opportunity', label: '商机' },
  { value: 'contract', label: '合同' },
  { value: 'order', label: '订单' },
  { value: 'notification', label: '通知' },
  { value: 'welcome', label: '欢迎' },
];

const PRESET_VARIABLES = [
  { name: 'customer_name', label: '客户名称', description: '客户的公司名称或个人姓名' },
  { name: 'contact_name', label: '联系人姓名', description: '联系人的姓名' },
  { name: 'contact_email', label: '联系人邮箱', description: '联系人的邮箱地址' },
  { name: 'opportunity_name', label: '商机名称', description: '商机/项目的名称' },
  { name: 'opportunity_value', label: '商机金额', description: '商机的预估金额' },
  { name: 'contract_number', label: '合同编号', description: '合同编号' },
  { name: 'order_number', label: '订单编号', description: '订单编号' },
  { name: 'sales_name', label: '销售人员', description: '负责的销售人员姓名' },
  { name: 'company_name', label: '公司名称', description: '您的公司名称' },
  { name: 'current_date', label: '当前日期', description: '邮件发送日期' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'general',
    subject: '',
    body: '',
    variables: [] as string[],
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/emails/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('获取邮件模板失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingTemplate
        ? `/api/emails/templates/${editingTemplate.id}`
        : '/api/emails/templates';

      const response = await fetch(url, {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          variables: formData.variables,
        }),
      });

      if (response.ok) {
        await fetchTemplates();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || '保存失败');
      }
    } catch (error) {
      console.error('保存邮件模板失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个模板吗？')) return;

    try {
      const response = await fetch(`/api/emails/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTemplates();
      }
    } catch (error) {
      console.error('删除邮件模板失败:', error);
    }
  };

  const openEditDialog = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      category: template.category,
      subject: template.subject,
      body: template.body,
      variables: JSON.parse(template.variables || '[]'),
      is_active: template.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      category: 'general',
      subject: '',
      body: '',
      variables: [],
      is_active: true,
    });
  };

  const insertVariable = (variable: string) => {
    setFormData({
      ...formData,
      body: formData.body + `{{${variable}}}`,
      variables: formData.variables.includes(variable)
        ? formData.variables
        : [...formData.variables, variable],
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getPreviewContent = (template: EmailTemplate) => {
    const previewVars: Record<string, string> = {
      customer_name: '示例科技有限公司',
      contact_name: '张三',
      contact_email: 'zhangsan@example.com',
      opportunity_name: 'XX项目合作',
      opportunity_value: '¥50,000',
      contract_number: 'CT-2024-001',
      order_number: 'PO-2024-001',
      sales_name: '李四',
      company_name: '我的公司',
      current_date: new Date().toLocaleDateString('zh-CN'),
    };

    let subject = template.subject;
    let body = template.body;

    Object.entries(previewVars).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value);
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return { subject, body };
  };

  const filteredTemplates = templates.filter((template) => {
    const matchCategory = filterCategory === 'all' || template.category === filterCategory;
    const matchSearch =
      !searchTerm ||
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCategory && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8" />
            邮件模板
          </h1>
          <p className="text-muted-foreground mt-1">管理和创建邮件模板，支持变量替换</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          添加模板
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="搜索模板..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {TEMPLATE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">模板列表</TabsTrigger>
          <TabsTrigger value="variables">变量说明</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          {filteredTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">暂无邮件模板</p>
                <p className="text-sm text-muted-foreground mt-1">
                  点击上方按钮创建第一个模板
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTemplates.map((template) => (
                <Card key={template.id} className="relative">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {!template.is_active && (
                        <Badge variant="secondary">已禁用</Badge>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      {TEMPLATE_CATEGORIES.find((c) => c.value === template.category)?.label || template.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">主题</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {template.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Variable className="h-3 w-3" />
                      {JSON.parse(template.variables || '[]').length} 个变量
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setPreviewTemplate(template);
                          setIsPreviewOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        预览
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="variables">
          <Card>
            <CardHeader>
              <CardTitle>可用变量</CardTitle>
              <CardDescription>
                在邮件模板中使用 <code className="bg-muted px-1 rounded">{'{{变量名}}'}</code> 格式引用变量
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {PRESET_VARIABLES.map((variable) => (
                  <div
                    key={variable.name}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-0.5 rounded text-sm">
                          {'{{' + variable.name + '}}'}
                        </code>
                        <span className="font-medium">{variable.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{variable.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(`{{${variable.name}}}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加/编辑模板对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? '编辑邮件模板' : '添加邮件模板'}
            </DialogTitle>
            <DialogDescription>
              创建可复用的邮件模板，支持变量替换
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">模板名称</Label>
                <Input
                  id="name"
                  placeholder="如：客户报价确认"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">邮件主题</Label>
              <Input
                id="subject"
                placeholder="如：{{customer_name}} 报价确认 - {{company_name}}"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>快速插入变量</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_VARIABLES.slice(0, 6).map((variable) => (
                  <Button
                    key={variable.name}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => insertVariable(variable.name)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {variable.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">邮件内容 (支持 HTML)</Label>
              <Textarea
                id="body"
                placeholder="请输入邮件内容..."
                className="min-h-[200px] font-mono text-sm"
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>已添加的变量</Label>
              <div className="flex flex-wrap gap-2">
                {formData.variables.length === 0 ? (
                  <span className="text-sm text-muted-foreground">暂无变量</span>
                ) : (
                  formData.variables.map((v) => (
                    <Badge key={v} variant="secondary">
                      {`{{${v}}}`}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
              >
                {formData.is_active ? '停用模板' : '启用模板'}
              </Button>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {saving ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>邮件预览</DialogTitle>
            <DialogDescription>
              {previewTemplate?.name}
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>收件人</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <div className="font-medium">示例科技有限公司</div>
                  <div className="text-muted-foreground">demo@example.com</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>主题</Label>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {getPreviewContent(previewTemplate).subject}
                </div>
              </div>

              <div className="space-y-2">
                <Label>内容</Label>
                <div
                  className="p-4 bg-muted rounded-lg text-sm prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: getPreviewContent(previewTemplate).body,
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
