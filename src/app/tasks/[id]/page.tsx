'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Trash2, 
  CheckCircle2, 
  Calendar, 
  Clock,
  AlertTriangle,
  Users,
  Briefcase,
  Lightbulb,
  FileText,
  Package,
  ArrowRight
} from 'lucide-react';
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import { format, parseISO, isAfter, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TaskDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { tasks, completeTask, deleteTask } = useCRM();
  
  const task = tasks.find(t => t.id === id);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!task) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">任务不存在</h1>
          <p className="text-muted-foreground mb-4">该任务可能被已删除</p>
          <Button asChild>
            <Link href="/tasks">返回任务列表</Link>
          </Button>
        </div>
      </div>
    );
  }

  const today = startOfDay(new Date());
  const dueDate = parseISO(task.dueDate);
  const isOverdue = task.status !== 'completed' && task.status !== 'cancelled' && isAfter(today, dueDate);
  
  const statusConfig = TASK_STATUS_CONFIG[task.status];
  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
  const typeConfig = TASK_TYPE_CONFIG[task.type];

  const getRelatedIcon = () => {
    switch (task.relatedType) {
      case 'customer': return <Users className="h-4 w-4" />;
      case 'opportunity': return <Briefcase className="h-4 w-4" />;
      case 'lead': return <Lightbulb className="h-4 w-4" />;
      case 'contract': return <FileText className="h-4 w-4" />;
      case 'order': return <Package className="h-4 w-4" />;
      default: return null;
    }
  };

  const getRelatedHref = () => {
    switch (task.relatedType) {
      case 'customer': return `/customers/${task.relatedId}`;
      case 'opportunity': return `/opportunities/${task.relatedId}`;
      case 'lead': return `/leads/${task.relatedId}`;
      case 'contract': return `/contracts/${task.relatedId}`;
      case 'order': return `/orders/${task.relatedId}`;
      default: return null;
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeTask(task.id);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteTask(task.id);
      router.push('/tasks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href="/tasks">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">任务详情</h1>
                <p className="text-sm text-muted-foreground">
                  查看和编辑任务信息
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {task.status !== 'completed' && task.status !== 'cancelled' && (
                <Button 
                  variant="outline" 
                  onClick={handleComplete}
                  disabled={loading}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  完成任务
                </Button>
              )}
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Task Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className={cn(
                  "text-xl font-bold mb-2",
                  task.status === 'completed' && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </h2>
                {task.description && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Details */}
        <div className="grid gap-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>任务信息</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <span>{typeConfig.icon}</span>
                    <span className="text-muted-foreground">类型</span>
                  </div>
                  <span className="font-medium">{typeConfig.label}</span>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    {task.priority === 'urgent' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    <span className="text-muted-foreground">优先级</span>
                  </div>
                  <Badge className={cn(priorityConfig.className)}>
                    {priorityConfig.label}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg",
                  isOverdue ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/50"
                )}>
                  <Calendar className={cn(
                    "h-4 w-4",
                    isOverdue ? "text-red-500" : "text-muted-foreground"
                  )} />
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">截止日期</span>
                    <span className={cn(
                      "font-medium",
                      isOverdue && "text-red-600"
                    )}>
                      {format(dueDate, 'yyyy年MM月dd日', { locale: zhCN })}
                      {isOverdue && <span className="ml-2 text-red-600">(已逾期)</span>}
                    </span>
                  </div>
                </div>
                
                {task.completedAt && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">完成时间</span>
                      <span className="font-medium text-green-600">
                        {format(parseISO(task.completedAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">创建时间</span>
                  <span className="font-medium">
                    {format(parseISO(task.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Entity */}
          {task.relatedName && task.relatedType && (
            <Card>
              <CardHeader>
                <CardTitle>关联对象</CardTitle>
                <CardDescription>此任务关联的业务对象</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-3 h-auto py-4"
                  asChild={!!getRelatedHref()}
                  onClick={() => getRelatedHref() && router.push(getRelatedHref()!)}
                >
                  <div className="flex items-center gap-3">
                    {getRelatedIcon()}
                    <div className="flex flex-col items-start">
                      <span className="text-sm text-muted-foreground">
                        {task.relatedType === 'customer' ? '客户' : 
                         task.relatedType === 'lead' ? '销售线索' :
                         task.relatedType === 'opportunity' ? '商机' :
                         task.relatedType === 'contract' ? '合同' : '订单'}
                      </span>
                      <span className="font-medium">{task.relatedName}</span>
                    </div>
                    {getRelatedHref() && <ArrowRight className="h-4 w-4 ml-auto" />}
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除任务「{task.title}」吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
