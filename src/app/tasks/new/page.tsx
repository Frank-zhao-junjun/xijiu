'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Calendar, AlertTriangle, Users, Briefcase } from 'lucide-react';
import { TASK_TYPE_CONFIG, TASK_PRIORITY_CONFIG } from '@/lib/crm-types';
import { format, addDays } from 'date-fns';
import Link from 'next/link';

export default function NewTaskPage() {
  const router = useRouter();
  const { addTask, customers, opportunities, leads } = useCRM();
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'follow_up' as const,
    priority: 'medium' as const,
    relatedType: '' as '' | 'customer' | 'lead' | 'opportunity' | 'contract' | 'order',
    relatedId: '',
    relatedName: '',
    dueDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.title.trim()) {
      newErrors.title = '请输入任务标题';
    }
    if (!form.dueDate) {
      newErrors.dueDate = '请选择截止日期';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await addTask({
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        priority: form.priority,
        status: 'pending',
        relatedType: form.relatedType || undefined,
        relatedId: form.relatedId || undefined,
        relatedName: form.relatedName || undefined,
        dueDate: form.dueDate,
      });
      router.push('/tasks');
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRelatedChange = (type: string, id: string) => {
    setForm(prev => {
      let name = '';
      if (type === 'customer' && id) {
        name = customers.find(c => c.id === id)?.name || '';
      } else if (type === 'opportunity' && id) {
        name = opportunities.find(o => o.id === id)?.title || '';
      } else if (type === 'lead' && id) {
        name = leads.find(l => l.id === id)?.title || '';
      }
      return {
        ...prev,
        relatedType: type as typeof form.relatedType,
        relatedId: id,
        relatedName: name,
      };
    });
  };

  const getRelatedOptions = () => {
    switch (form.relatedType) {
      case 'customer':
        return customers.map(c => ({ id: c.id, name: c.name }));
      case 'opportunity':
        return opportunities.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost')
          .map(o => ({ id: o.id, name: o.title }));
      case 'lead':
        return leads.filter(l => l.status !== 'disqualified')
          .map(l => ({ id: l.id, name: l.title }));
      default:
        return [];
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/tasks">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">新建任务</h1>
              <p className="text-sm text-muted-foreground">
                创建一个新的销售任务
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>填写任务的基本信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">
                  任务标题 <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="请输入任务标题"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">任务描述</Label>
                <Textarea
                  id="description"
                  placeholder="详细描述任务内容..."
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>任务类型</Label>
                  <Select 
                    value={form.type} 
                    onValueChange={(v) => setForm(prev => ({ ...prev, type: v as typeof form.type }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_TYPE_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.icon} {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    优先级 <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={form.priority} 
                    onValueChange={(v) => setForm(prev => ({ ...prev, priority: v as typeof form.priority }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TASK_PRIORITY_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <span className={cn("font-medium", config.color)}>
                            {key === 'urgent' && <AlertTriangle className="inline h-3 w-3 mr-1" />}
                            {config.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate">
                  截止日期 <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dueDate"
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={`pl-10 ${errors.dueDate ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.dueDate && (
                  <p className="text-sm text-red-500">{errors.dueDate}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Related Entity */}
          <Card>
            <CardHeader>
              <CardTitle>关联对象</CardTitle>
              <CardDescription>将任务关联到客户、线索或商机</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>关联类型</Label>
                  <Select 
                    value={form.relatedType} 
                    onValueChange={(v) => {
                      setForm(prev => ({ ...prev, relatedType: v as typeof prev.relatedType, relatedId: '', relatedName: '' }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择关联类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">
                        <span className="flex items-center gap-2">
                          <Users className="h-4 w-4" /> 客户
                        </span>
                      </SelectItem>
                      <SelectItem value="lead">
                        <span className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" /> 线索
                        </span>
                      </SelectItem>
                      <SelectItem value="opportunity">
                        <span className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" /> 商机
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>选择关联对象</Label>
                  <Select 
                    value={form.relatedId} 
                    onValueChange={(v) => handleRelatedChange(form.relatedType, v)}
                    disabled={!form.relatedType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={form.relatedType ? "选择对象" : "先选择类型"} />
                    </SelectTrigger>
                    <SelectContent>
                      {getRelatedOptions().map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {form.relatedName && (
                <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                  已关联: {form.relatedName}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={() => router.push('/tasks')}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? '保存中...' : '保存任务'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
