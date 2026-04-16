'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { CalendarView, CalendarEvent, CalendarViewType } from '@/components/crm/calendar-view';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<CalendarViewType>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [, setCreateDate] = useState<Date>(new Date());
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  
  const { toast } = useToast();

  // Form state for creating/editing events
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'task' as 'opportunity' | 'task' | 'activity',
    customerName: '',
  });

  // Fetch events
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const start = format(new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), 'yyyy-MM-dd');
      const end = format(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), 'yyyy-MM-dd');
      
      const response = await fetch(`/api/calendar?startDate=${start}&endDate=${end}`);
      const result = await response.json();
      
      if (result.success) {
        setEvents(result.data);
      }
    } catch (_error) {
      toast({
        title: '获取事件失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, toast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle event click
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      startDate: event.startDate,
      endDate: event.endDate,
      type: event.type,
      customerName: event.customerName || '',
    });
    setIsEventDialogOpen(true);
  }, []);

  // Handle create event
  const handleCreateEvent = useCallback((date: Date) => {
    setCreateDate(date);
    setFormData({
      title: '',
      description: '',
      startDate: format(date, 'yyyy-MM-dd'),
      endDate: format(date, 'yyyy-MM-dd'),
      type: 'task',
      customerName: '',
    });
    setIsCreateDialogOpen(true);
  }, []);

  // Handle event drop (drag)
  const handleEventDrop = useCallback(async (eventId: string, newDate: Date) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    try {
      const response = await fetch('/api/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: eventId,
          startDate: format(newDate, 'yyyy-MM-dd'),
          endDate: format(newDate, 'yyyy-MM-dd'),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, startDate: format(newDate, 'yyyy-MM-dd'), endDate: format(newDate, 'yyyy-MM-dd') }
              : e
          )
        );
        toast({
          title: '事件已移动',
          description: `已移动到 ${format(newDate, 'M月d日')}`,
        });
      }
    } catch {
      toast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  }, [events, toast]);

  // Submit form
  const handleSubmit = async (isNew: boolean) => {
    try {
      const method = isNew ? 'POST' : 'PATCH';
      const response = await fetch('/api/calendar', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: isNew ? '事件已创建' : '事件已更新',
          description: result.message,
        });
        setIsCreateDialogOpen(false);
        setIsEventDialogOpen(false);
        fetchEvents();
      } else {
        toast({
          title: '操作失败',
          description: result.message,
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '操作失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  // Delete event
  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      const response = await fetch(`/api/calendar?id=${selectedEvent.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast({
          title: '事件已删除',
          description: result.message,
        });
        setIsEventDialogOpen(false);
        fetchEvents();
      }
    } catch {
      toast({
        title: '删除失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">日历视图</h1>
            <p className="text-muted-foreground">
              统一管理商机、任务和活动日程
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">商机</CardTitle>
              <div className="h-4 w-4 rounded-full bg-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter((e) => e.type === 'opportunity').length}
              </div>
              <p className="text-xs text-muted-foreground">
                本月商机日程
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">任务</CardTitle>
              <div className="h-4 w-4 rounded-full bg-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter((e) => e.type === 'task').length}
              </div>
              <p className="text-xs text-muted-foreground">
                待处理任务
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">活动</CardTitle>
              <div className="h-4 w-4 rounded-full bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {events.filter((e) => e.type === 'activity').length}
              </div>
              <p className="text-xs text-muted-foreground">
                计划活动
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总计</CardTitle>
              <div className="h-4 w-4 rounded-full bg-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{events.length}</div>
              <p className="text-xs text-muted-foreground">
                本月事件总数
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="flex-1">
          <CardContent className="p-0">
            <CalendarView
              events={events}
              currentDate={currentDate}
              viewType={viewType}
              onDateChange={setCurrentDate}
              onViewChange={setViewType}
              onEventClick={handleEventClick}
              onEventDrop={handleEventDrop}
              onCreateEvent={handleCreateEvent}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>新建事件</DialogTitle>
            <DialogDescription>
              创建一个新的日程事件
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">标题</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="输入事件标题"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'opportunity' | 'task' | 'activity' })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择事件类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opportunity">商机</SelectItem>
                  <SelectItem value="task">任务</SelectItem>
                  <SelectItem value="activity">活动</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customerName">关联客户</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="输入客户名称（可选）"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="输入事件描述（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={() => handleSubmit(true)}>
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>事件详情</DialogTitle>
            <DialogDescription>
              查看和编辑事件信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">标题</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-type">类型</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value as 'opportunity' | 'task' | 'activity' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="opportunity">商机</SelectItem>
                  <SelectItem value="task">任务</SelectItem>
                  <SelectItem value="activity">活动</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-startDate">开始日期</Label>
                <Input
                  id="edit-startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-endDate">结束日期</Label>
                <Input
                  id="edit-endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-customerName">关联客户</Label>
              <Input
                id="edit-customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="destructive" onClick={handleDeleteEvent}>
              删除
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={() => handleSubmit(false)}>
                保存
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
