'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Zap, Plus, Play, Trash2, AlertTriangle, CheckCircle2,
  Loader2, ArrowRight, Activity, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  WORKFLOW_TRIGGER_CONFIG,
  WORKFLOW_ACTION_CONFIG,
  type WorkflowTriggerType,
  type Workflow,
  type WorkflowLog,
  type WorkflowAction,
} from '@/lib/crm-types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface WorkflowWithLogs extends Workflow {
  logs?: WorkflowLog[];
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WorkflowWithLogs[]>([]);
  const [logs, setLogs] = useState<WorkflowLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/workflows');
      if (res.ok) {
        const data = await res.json();
        setWorkflows((data.workflows || []).map((w: Record<string, unknown>) => ({
          id: w.id as string,
          name: w.name as string,
          description: w.description as string,
          triggerType: w.trigger_type as WorkflowTriggerType,
          triggerEntity: w.trigger_entity as string,
          conditions: typeof w.conditions === 'string' ? JSON.parse(w.conditions || '{}') : w.conditions || [],
          actions: typeof w.actions === 'string' ? JSON.parse(w.actions || '[]') : w.actions || [],
          isActive: w.is_active as boolean,
          isTemplate: w.is_template as boolean,
          runCount: w.run_count as number,
          lastRunAt: w.last_run_at as string,
          createdAt: w.created_at as string,
          updatedAt: w.updated_at as string,
        })));
        setLogs((data.recentLogs || []).map((l: Record<string, unknown>) => ({
          id: l.id as string,
          workflowId: l.workflow_id as string,
          workflowName: l.workflow_name as string,
          triggerType: l.trigger_type as string,
          triggerEntity: l.trigger_entity as string,
          triggerEntityId: l.trigger_entity_id as string,
          actionTaken: l.action_taken as string,
          actionDetail: l.action_detail as string,
          result: l.result as 'success' | 'failed',
          createdAt: l.created_at as string,
        })));
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const toggleWorkflow = async (id: string, isActive: boolean) => {
    const res = await fetch('/api/workflows', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, data: { isActive: !isActive } }),
    });
    if (res.ok) fetchData();
  };

  const deleteWorkflow = async (id: string) => {
    if (!confirm('确定要删除此工作流？')) return;
    const res = await fetch(`/api/workflows?id=${id}`, { method: 'DELETE' });
    if (res.ok) fetchData();
  };

  const seedTemplates = async () => {
    const res = await fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seedTemplates' }),
    });
    if (res.ok) fetchData();
  };

  const activeCount = workflows.filter(w => w.isActive).length;
  const templateCount = workflows.filter(w => w.isTemplate).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">工作流自动化</h1>
          <p className="text-muted-foreground mt-1">配置自动化规则，让系统自动执行重复任务</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={seedTemplates}>
            <FileText className="h-4 w-4 mr-1" />
            初始化模板
          </Button>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                新建工作流
              </Button>
            </DialogTrigger>
            <CreateWorkflowDialog onClose={() => { setShowCreate(false); fetchData(); }} />
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">工作流总数</p>
                <p className="text-xl font-bold">{workflows.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">已启用</p>
                <p className="text-xl font-bold text-green-600">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">模板</p>
                <p className="text-xl font-bold">{templateCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500/10 to-amber-500/10">
                <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">总执行次数</p>
                <p className="text-xl font-bold">{workflows.reduce((sum, w) => sum + w.runCount, 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workflow List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            工作流列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无工作流</p>
              <p className="text-xs text-muted-foreground/60 mt-1">点击「初始化模板」快速创建常用工作流</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={seedTemplates}>
                初始化模板
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {workflows.map((workflow) => {
                const triggerConfig = WORKFLOW_TRIGGER_CONFIG[workflow.triggerType];
                const actions: WorkflowAction[] = workflow.actions || [];
                return (
                  <div
                    key={workflow.id}
                    className={cn(
                      'flex items-start justify-between p-4 rounded-xl border transition-all duration-200',
                      'hover:border-primary/30 hover:shadow-md',
                      workflow.isActive ? 'border-green-200 dark:border-green-900/50 bg-green-50/30 dark:bg-green-950/10' : 'border-border'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{workflow.name}</h3>
                        {workflow.isTemplate && (
                          <Badge variant="outline" className="text-xs">模板</Badge>
                        )}
                        <Badge
                          variant={workflow.isActive ? 'default' : 'secondary'}
                          className={cn('text-xs', workflow.isActive && 'bg-green-600')}
                        >
                          {workflow.isActive ? '已启用' : '已禁用'}
                        </Badge>
                      </div>
                      {workflow.description && (
                        <p className="text-xs text-muted-foreground mt-1">{workflow.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        {/* Trigger */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">触发:</span>
                          <Badge variant="outline" className="text-xs">
                            {triggerConfig?.label || workflow.triggerType}
                          </Badge>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        {/* Actions */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-muted-foreground">动作:</span>
                          {actions.map((action, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {WORKFLOW_ACTION_CONFIG[action.type]?.label || action.type}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {workflow.runCount > 0 && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>执行 {workflow.runCount} 次</span>
                          {workflow.lastRunAt && (
                            <span>最近: {formatDistanceToNow(new Date(workflow.lastRunAt), { addSuffix: true, locale: zhCN })}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={workflow.isActive}
                        onCheckedChange={() => toggleWorkflow(workflow.id, workflow.isActive)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => deleteWorkflow(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              执行日志
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className={cn(
                  'flex items-center justify-between p-3 rounded-lg border',
                  log.result === 'success' ? 'border-green-200 dark:border-green-900/50' : 'border-red-200 dark:border-red-900/50'
                )}>
                  <div className="flex items-center gap-3">
                    {log.result === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{log.workflowName}</p>
                      <p className="text-xs text-muted-foreground">
                        {WORKFLOW_ACTION_CONFIG[log.actionTaken as keyof typeof WORKFLOW_ACTION_CONFIG]?.label || log.actionTaken}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={log.result === 'success' ? 'default' : 'destructive'} className="text-xs">
                      {log.result === 'success' ? '成功' : '失败'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: zhCN })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Create Workflow Dialog
function CreateWorkflowDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<WorkflowTriggerType>('lead_created');
  const [actionType, setActionType] = useState<'create_task' | 'send_notification'>('create_task');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [delayHours, setDelayHours] = useState('24');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name) return;
    setSaving(true);
    try {
      const triggerConfig = WORKFLOW_TRIGGER_CONFIG[triggerType];
      const actions = actionType === 'create_task' ? [{
        type: 'create_task',
        config: {
          title: taskTitle || `跟进${triggerConfig?.entity || '客户'}`,
          priority: taskPriority,
          delayHours: Number(delayHours),
          assignedTo: 'sales_a',
        },
      }] : [{
        type: 'send_notification',
        config: {
          notificationType: 'info',
          title: notifTitle || `${name}通知`,
          message: notifMessage || `${name}已触发`,
        },
      }];

      await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            name,
            description,
            triggerType,
            triggerEntity: triggerConfig?.entity || 'lead',
            conditions: {},
            actions,
            isActive: true,
          },
        }),
      });
      onClose();
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>新建工作流</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>工作流名称</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：新线索自动跟进" />
        </div>
        <div className="space-y-2">
          <Label>描述</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="工作流的功能说明" rows={2} />
        </div>
        <div className="space-y-2">
          <Label>触发条件</Label>
          <Select value={triggerType} onValueChange={(v) => setTriggerType(v as WorkflowTriggerType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(WORKFLOW_TRIGGER_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>
                  <div>
                    <span className="font-medium">{config.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{config.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>执行动作</Label>
          <Select value={actionType} onValueChange={(v) => setActionType(v as 'create_task' | 'send_notification')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create_task">创建任务</SelectItem>
              <SelectItem value="send_notification">发送通知</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {actionType === 'create_task' && (
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <div className="space-y-2">
              <Label className="text-xs">任务标题</Label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="跟进新线索" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">优先级</Label>
                <Select value={taskPriority} onValueChange={setTaskPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">低</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">截止时间(小时后)</Label>
                <Input type="number" value={delayHours} onChange={(e) => setDelayHours(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {actionType === 'send_notification' && (
          <div className="space-y-3 p-3 rounded-lg border bg-muted/30">
            <div className="space-y-2">
              <Label className="text-xs">通知标题</Label>
              <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="工作流通知" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">通知内容</Label>
              <Textarea value={notifMessage} onChange={(e) => setNotifMessage(e.target.value)} placeholder="通知的详细内容" rows={2} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={!name || saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            创建
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
