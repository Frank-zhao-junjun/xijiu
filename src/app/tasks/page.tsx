'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, CheckCircle2, Circle, Trash2, MoreVertical, AlertTriangle, Calendar, Filter } from 'lucide-react';
import { TASK_PRIORITY_CONFIG, TASK_TYPE_CONFIG } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import { format, isAfter, parseISO, startOfDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function TasksPage() {
  const router = useRouter();
  const { tasks, completeTask, deleteTask } = useCRM();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const today = startOfDay(new Date());

  // 过滤任务
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // 统计
  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return false;
      const dueDate = parseISO(t.dueDate);
      return isAfter(today, dueDate);
    }).length,
  };

  const handleComplete = async (id: string) => {
    await completeTask(id);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteTask(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Circle className="h-4 w-4 text-blue-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const isOverdue = (task: typeof tasks[0]) => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    const dueDate = parseISO(task.dueDate);
    return isAfter(today, dueDate);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">任务管理</h1>
              <p className="text-sm text-muted-foreground mt-1">
                管理您的销售任务和待办事项
              </p>
            </div>
            <Button onClick={() => router.push('/tasks/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              新建任务
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">全部任务</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">{stats.pending}</div>
              <div className="text-sm text-muted-foreground">待办</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
              <div className="text-sm text-muted-foreground">进行中</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-muted-foreground">已完成</div>
            </CardContent>
          </Card>
          <Card className={cn(stats.overdue > 0 && "border-red-200 bg-red-50/50 dark:bg-red-950/20")}>
            <CardContent className="p-4">
              <div className={cn("text-2xl font-bold", stats.overdue > 0 ? "text-red-600" : "text-gray-600")}>
                {stats.overdue}
              </div>
              <div className="text-sm text-muted-foreground">已逾期</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索任务..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部状态</SelectItem>
                    <SelectItem value="pending">待办</SelectItem>
                    <SelectItem value="in_progress">进行中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                    <SelectItem value="cancelled">已取消</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="优先级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部优先级</SelectItem>
                    <SelectItem value="urgent">紧急</SelectItem>
                    <SelectItem value="high">高</SelectItem>
                    <SelectItem value="medium">中</SelectItem>
                    <SelectItem value="low">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">状态</TableHead>
                  <TableHead>任务</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>截止日期</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {tasks.length === 0 ? '暂无任务，点击"新建任务"创建第一个任务' : '没有找到匹配的任务'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTasks.map((task) => {
                    const overdue = isOverdue(task);
                    const typeConfig = TASK_TYPE_CONFIG[task.type];
                    const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];
                    
                    return (
                      <TableRow 
                        key={task.id} 
                        className={cn(
                          task.status === 'completed' && "opacity-60",
                          overdue && "bg-red-50/50 dark:bg-red-950/20"
                        )}
                      >
                        <TableCell>
                          <button
                            onClick={() => handleComplete(task.id)}
                            className="hover:opacity-70 transition-opacity"
                            disabled={task.status === 'completed'}
                          >
                            {getStatusIcon(task.status)}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "font-medium",
                              task.status === 'completed' && "line-through text-muted-foreground"
                            )}>
                              {task.title}
                            </span>
                            {task.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </span>
                            )}
                            {task.relatedName && (
                              <span className="text-xs text-blue-600">
                                关联: {task.relatedName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="gap-1">
                            <span>{typeConfig.icon}</span>
                            {typeConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(priorityConfig.className, "gap-1")}>
                            {task.priority === 'urgent' && <AlertTriangle className="h-3 w-3" />}
                            {priorityConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={cn(
                            "flex items-center gap-1 text-sm",
                            overdue && "text-red-600 font-medium"
                          )}>
                            {overdue && <AlertTriangle className="h-3 w-3" />}
                            <Calendar className="h-3 w-3" />
                            {format(parseISO(task.dueDate), 'MM/dd', { locale: zhCN })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/tasks/${task.id}`)}>
                                查看详情
                              </DropdownMenuItem>
                              {task.status !== 'completed' && (
                                <DropdownMenuItem onClick={() => handleComplete(task.id)}>
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  标记完成
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(task.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                删除
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这个任务吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
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
