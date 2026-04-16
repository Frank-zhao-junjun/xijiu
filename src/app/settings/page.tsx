'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>系统设置</CardTitle>
          <CardDescription>
            管理您的CRM系统设置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">通知设置</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">邮件通知</Label>
                <p className="text-sm text-muted-foreground">
                  接收重要更新的邮件通知
                </p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="activity-alerts">活动提醒</Label>
                <p className="text-sm text-muted-foreground">
                  客户和机会变更时发送提醒
                </p>
              </div>
              <Switch id="activity-alerts" defaultChecked />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">数据管理</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-save">自动保存</Label>
                <p className="text-sm text-muted-foreground">
                  编辑时自动保存草稿
                </p>
              </div>
              <Switch id="auto-save" defaultChecked />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">系统信息</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">版本</p>
                <p className="text-sm font-medium">1.0.0</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">状态</p>
                <Badge variant="secondary">演示版本</Badge>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              这是一个演示版本的CRM系统，所有数据存储在本地浏览器中。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">
            使用以下快捷键提高工作效率：
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">新建客户</span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                Ctrl + K + C
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">新建机会</span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                Ctrl + K + O
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">搜索</span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                Ctrl + K
              </kbd>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <span className="text-sm">仪表盘</span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded">
                Ctrl + K + D
              </kbd>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
