'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Mail,
  Plus,
  Trash2,
  Edit,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2,
  Server,
} from 'lucide-react';

interface EmailConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  from_name: string;
  from_email: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
}

export default function EmailSettingsPage() {
  const [configs, setConfigs] = useState<EmailConfig[]>([]);
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<EmailConfig | null>(null);
  const [testEmail, setTestEmail] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    from_name: '',
    from_email: '',
    is_default: false,
  });

  useEffect(() => {
    fetchConfigs();
    fetchStats();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/emails/config');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error('获取邮件配置失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/emails/logs');
      if (response.ok) {
        const data = await response.json();
        const { logs } = data;
        setStats({
          total: logs.length,
          sent: logs.filter((l: { status: string }) => l.status === 'sent').length,
          failed: logs.filter((l: { status: string }) => l.status === 'failed').length,
          pending: logs.filter((l: { status: string }) => l.status === 'pending').length,
        });
      }
    } catch (error) {
      console.error('获取邮件统计失败:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingConfig
        ? `/api/emails/config/${editingConfig.id}`
        : '/api/emails/config';
      
      const response = await fetch(url, {
        method: editingConfig ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchConfigs();
        setIsDialogOpen(false);
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || '保存失败');
      }
    } catch (error) {
      console.error('保存邮件配置失败:', error);
      alert('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个邮件配置吗？')) return;

    try {
      const response = await fetch(`/api/emails/config/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchConfigs();
      }
    } catch (error) {
      console.error('删除邮件配置失败:', error);
    }
  };

  const handleTest = async (configId: string) => {
    setTesting(configId);
    setTestResult(null);

    try {
      const response = await fetch(`/api/emails/config/${configId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_email: testEmail }),
      });

      const result = await response.json();
      setTestResult(result);
    } catch {
      setTestResult({ success: false, message: '测试失败' });
    } finally {
      setTesting(null);
    }
  };

  const openEditDialog = (config: EmailConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      host: config.host,
      port: config.port,
      secure: config.secure,
      username: config.username,
      password: '',
      from_name: config.from_name,
      from_email: config.from_email,
      is_default: config.is_default,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      from_name: '',
      from_email: '',
      is_default: false,
    });
  };

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
            <Mail className="h-8 w-8" />
            邮件设置
          </h1>
          <p className="text-muted-foreground mt-1">管理 SMTP 配置和发送设置</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          添加配置
        </Button>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总发送量</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成功</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">失败</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">待发送</CardTitle>
              <Loader2 className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="configs">
        <TabsList>
          <TabsTrigger value="configs">SMTP 配置</TabsTrigger>
          <TabsTrigger value="guide">配置指南</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>邮件服务器配置</CardTitle>
              <CardDescription>配置 SMTP 服务器以发送邮件</CardDescription>
            </CardHeader>
            <CardContent>
              {configs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无邮件配置</p>
                  <p className="text-sm">点击上方按钮添加第一个 SMTP 配置</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>配置名称</TableHead>
                      <TableHead>SMTP 服务器</TableHead>
                      <TableHead>发件人</TableHead>
                      <TableHead>默认</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {configs.map((config) => (
                      <TableRow key={config.id}>
                        <TableCell className="font-medium">{config.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            {config.host}:{config.port}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{config.from_name}</span>
                            <span className="text-xs text-muted-foreground">{config.from_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {config.is_default && (
                            <Badge variant="default">默认</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(config)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleTest(config.id)}
                              disabled={testing !== null}
                            >
                              {testing === config.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <TestTube className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(config.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {testResult && (
            <Alert variant={testResult.success ? 'default' : 'destructive'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="guide">
          <Card>
            <CardHeader>
              <CardTitle>常见邮箱配置指南</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold">📧 Gmail</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>主机:</strong> smtp.gmail.com</p>
                  <p><strong>端口:</strong> 587 (TLS) / 465 (SSL)</p>
                  <p><strong>用户名:</strong> 您的 Gmail 邮箱</p>
                  <p><strong>密码:</strong> 需要使用应用专用密码</p>
                  <p className="text-muted-foreground">注意: 需要在 Google 账户中启用「应用密码」或使用 OAuth2</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">📧 QQ 邮箱</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>主机:</strong> smtp.qq.com</p>
                  <p><strong>端口:</strong> 587</p>
                  <p><strong>用户名:</strong> 您的 QQ 邮箱</p>
                  <p><strong>密码:</strong> 需要在 QQ 邮箱设置中获取授权码</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">📧 163 邮箱</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>主机:</strong> smtp.163.com</p>
                  <p><strong>端口:</strong> 465 (SSL)</p>
                  <p><strong>用户名:</strong> 您的 163 邮箱</p>
                  <p><strong>密码:</strong> 需要在邮箱设置中获取授权码</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">📧 企业邮箱 (如阿里云、腾讯企业邮)</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                  <p><strong>主机:</strong> smtp.exmail.qq.com (腾讯) / smtp.mxhichina.com (阿里)</p>
                  <p><strong>端口:</strong> 465 (SSL)</p>
                  <p><strong>用户名:</strong> 完整邮箱地址</p>
                  <p><strong>密码:</strong> 企业邮箱登录密码或专用密码</p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  <strong>安全提示:</strong> 密码在传输过程中会被加密存储。建议使用应用专用密码而非登录密码。
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 添加/编辑配置对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? '编辑邮件配置' : '添加邮件配置'}
            </DialogTitle>
            <DialogDescription>
              填写 SMTP 服务器配置信息
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">配置名称</Label>
                <Input
                  id="name"
                  placeholder="如：工作邮箱"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="host">SMTP 主机</Label>
                <Input
                  id="host"
                  placeholder="smtp.example.com"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="port">端口</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="587"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  placeholder="your@email.com"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码/授权码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={editingConfig ? '留空则保持原密码' : ''}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingConfig}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_name">发件人名称</Label>
                <Input
                  id="from_name"
                  placeholder="CRM 系统"
                  value={formData.from_name}
                  onChange={(e) => setFormData({ ...formData, from_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="from_email">发件人邮箱</Label>
                <Input
                  id="from_email"
                  type="email"
                  placeholder="noreply@example.com"
                  value={formData.from_email}
                  onChange={(e) => setFormData({ ...formData, from_email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="secure"
                checked={formData.secure}
                onCheckedChange={(checked) => setFormData({ ...formData, secure: checked })}
              />
              <Label htmlFor="secure">使用 SSL/TLS (通常端口 465 需要开启)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
              />
              <Label htmlFor="is_default">设为默认配置</Label>
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

      {/* 测试邮件对话框 */}
      <Dialog open={!!testResult} onOpenChange={() => setTestResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>测试邮件配置</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>测试邮箱地址</Label>
              <Input
                placeholder="输入测试邮箱"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            {testResult && (
              <Alert variant={testResult.success ? 'default' : 'destructive'}>
                {testResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{testResult.message}</AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
