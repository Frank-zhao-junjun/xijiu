'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Phone, Mail, Users, FileText, Plus, Clock, Check, Search, Loader2, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { FOLLOW_UP_METHOD_CONFIG, FOLLOW_UP_TEMPLATES, type FollowUpMethod, type FollowUp } from '@/lib/crm-types';
import Link from 'next/link';

const methodIcons: Record<FollowUpMethod, typeof Phone> = {
  phone: Phone,
  wechat: Mail,
  email: Mail,
  meeting: Users,
  other: FileText,
};

export default function FollowUpsPage() {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    entityType: 'customer' as 'customer' | 'lead' | 'opportunity',
    entityId: '',
    entityName: '',
    method: 'phone' as FollowUpMethod,
    content: '',
    nextFollowUpAt: '',
  });

  // Entity options for create dialog
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [leads, setLeads] = useState<{ id: string; title: string }[]>([]);
  const [opportunities, setOpportunities] = useState<{ id: string; title: string }[]>([]);

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm?type=followUps');
      if (res.ok) {
        const data = await res.json();
        setFollowUps(data.map((f: Record<string, unknown>) => ({
          id: f.id as string,
          entityType: f.entity_type as 'customer' | 'lead' | 'opportunity',
          entityId: f.entity_id as string,
          entityName: f.entity_name as string,
          type: f.type as string,
          method: (f.method || f.type || 'note') as FollowUpMethod,
          content: f.content as string,
          scheduledAt: f.scheduled_at as string | null,
          completedAt: f.completed_at as string | null,
          nextFollowUpAt: f.next_follow_up_at as string | null,
          createdBy: (f.created_by || 'sales_a') as string,
          isOverdue: !f.completed_at && f.scheduled_at ? new Date(f.scheduled_at as string) < new Date() : false,
          createdAt: f.created_at as string,
          updatedAt: f.updated_at as string,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const fetchEntities = useCallback(async () => {
    try {
      const [custRes, leadRes, oppRes] = await Promise.all([
        fetch('/api/crm?type=customers'),
        fetch('/api/crm?type=leads'),
        fetch('/api/crm?type=opportunities'),
      ]);
      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data.map((c: Record<string, unknown>) => ({ id: c.id as string, name: (c.company || c.name) as string })));
      }
      if (leadRes.ok) {
        const data = await leadRes.json();
        setLeads(data.map((l: Record<string, unknown>) => ({ id: l.id as string, title: l.title as string })));
      }
      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpportunities(data.map((o: Record<string, unknown>) => ({ id: o.id as string, title: o.title as string })));
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchFollowUps(); fetchEntities(); }, [fetchFollowUps, fetchEntities]);

  const handleComplete = async (id: string) => {
    try {
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'completeFollowUp', data: { followUpId: id } }),
      });
      fetchFollowUps();
    } catch { /* silent */ }
  };

  const handleCreate = async () => {
    try {
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createFollowUp',
          data: {
            entityType: createForm.entityType,
            entityId: createForm.entityId,
            entityName: createForm.entityName,
            type: createForm.method === 'phone' ? 'call' : createForm.method === 'meeting' ? 'meeting' : 'note',
            method: createForm.method,
            content: createForm.content,
            nextFollowUpAt: createForm.nextFollowUpAt || null,
          },
        }),
      });
      setShowCreate(false);
      setCreateForm({ entityType: 'customer', entityId: '', entityName: '', method: 'phone', content: '', nextFollowUpAt: '' });
      fetchFollowUps();
    } catch { /* silent */ }
  };

  const getEntityLink = (entityType: string, entityId: string) => {
    switch (entityType) {
      case 'customer': return `/customers/${entityId}`;
      case 'lead': return `/leads`;
      case 'opportunity': return `/opportunities/${entityId}`;
      default: return '#';
    }
  };

  const getEntityTypeLabel = (entityType: string) => {
    switch (entityType) {
      case 'customer': return '客户';
      case 'lead': return '线索';
      case 'opportunity': return '机会';
      default: return entityType;
    }
  };

  const filteredFollowUps = followUps.filter(fu => {
    const matchesSearch = fu.content.toLowerCase().includes(search.toLowerCase()) || fu.entityName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'completed' && fu.completedAt) ||
      (statusFilter === 'pending' && !fu.completedAt && !fu.isOverdue) ||
      (statusFilter === 'overdue' && fu.isOverdue);
    const matchesEntity = entityTypeFilter === 'all' || fu.entityType === entityTypeFilter;
    return matchesSearch && matchesStatus && matchesEntity;
  });

  // Sort: overdue first, then pending, then completed
  const sortedFollowUps = [...filteredFollowUps].sort((a, b) => {
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    if (!a.completedAt && b.completedAt) return -1;
    if (a.completedAt && !b.completedAt) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Get entity options based on selected type
  const entityOptions = createForm.entityType === 'customer'
    ? customers.map(c => ({ id: c.id, label: c.name }))
    : createForm.entityType === 'lead'
    ? leads.map(l => ({ id: l.id, label: l.title }))
    : opportunities.map(o => ({ id: o.id, label: o.title }));

  const handleEntitySelect = (entityId: string) => {
    const option = entityOptions.find(o => o.id === entityId);
    setCreateForm(prev => ({ ...prev, entityId, entityName: option?.label || '' }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">跟进记录</h1>
          <p className="text-muted-foreground mt-1">查看和管理所有跟进活动</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-r from-primary to-purple-600">
          <Plus className="h-4 w-4" />
          新建跟进
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索跟进内容或实体名称..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="overdue">逾期</SelectItem>
            <SelectItem value="pending">待完成</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="实体类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="customer">客户</SelectItem>
            <SelectItem value="lead">线索</SelectItem>
            <SelectItem value="opportunity">机会</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Follow-ups list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedFollowUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无跟进记录</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> 新建跟进
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {sortedFollowUps.map((fu) => {
                const methodConf = FOLLOW_UP_METHOD_CONFIG[fu.method] || FOLLOW_UP_METHOD_CONFIG.other;
                const IconComp = methodIcons[fu.method] || FileText;
                const isCompleted = !!fu.completedAt;

                return (
                  <div key={fu.id} className={cn(
                    "p-4 hover:bg-muted/50 transition-colors",
                    fu.isOverdue && !isCompleted && "bg-red-50/50 dark:bg-red-950/10"
                  )}>
                    <div className="flex items-start gap-3">
                      {/* Method icon */}
                      <div className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        isCompleted ? "bg-green-100 dark:bg-green-900/30" :
                        fu.isOverdue ? "bg-red-100 dark:bg-red-900/30" :
                        "bg-primary/10"
                      )}>
                        <IconComp className={cn(
                          "h-4 w-4",
                          isCompleted ? "text-green-600 dark:text-green-400" :
                          fu.isOverdue ? "text-red-600 dark:text-red-400" :
                          "text-primary"
                        )} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">{methodConf.label}</span>
                          {isCompleted && <Badge variant="outline" className="text-xs text-green-600 h-5">已完成</Badge>}
                          {fu.isOverdue && !isCompleted && <Badge variant="destructive" className="text-xs h-5">逾期</Badge>}
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(fu.createdAt), { addSuffix: true, locale: zhCN })}
                          </span>
                        </div>
                        <p className="text-sm line-clamp-2">{fu.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Link
                            href={getEntityLink(fu.entityType, fu.entityId)}
                            className="text-xs text-primary hover:underline"
                          >
                            {getEntityTypeLabel(fu.entityType)}: {fu.entityName}
                          </Link>
                          {fu.nextFollowUpAt && !isCompleted && (
                            <span className="text-xs text-muted-foreground">
                              下次跟进: {formatDistanceToNow(new Date(fu.nextFollowUpAt), { addSuffix: true, locale: zhCN })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action */}
                      {!isCompleted && (
                        <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs" onClick={() => handleComplete(fu.id)}>
                          <Check className="h-3 w-3" /> 完成
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建跟进记录</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Entity type selector */}
            <div className="space-y-2">
              <span className="text-sm font-medium">关联类型 *</span>
              <div className="flex gap-2">
                {(['customer', 'lead', 'opportunity'] as const).map(type => {
                  const labels = { customer: '客户', lead: '线索', opportunity: '机会' };
                  const icons = { customer: Users, lead: FileText, opportunity: Briefcase };
                  const Icon = icons[type];
                  return (
                    <Button
                      key={type}
                      variant={createForm.entityType === type ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1"
                      onClick={() => setCreateForm(prev => ({ ...prev, entityType: type, entityId: '', entityName: '' }))}
                    >
                      <Icon className="h-3.5 w-3.5" /> {labels[type]}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Entity selector */}
            <div className="space-y-2">
              <span className="text-sm font-medium">选择{createForm.entityType === 'customer' ? '客户' : createForm.entityType === 'lead' ? '线索' : '机会'} *</span>
              <Select value={createForm.entityId} onValueChange={handleEntitySelect}>
                <SelectTrigger>
                  <SelectValue placeholder={`选择${createForm.entityType === 'customer' ? '客户' : createForm.entityType === 'lead' ? '线索' : '机会'}`} />
                </SelectTrigger>
                <SelectContent>
                  {entityOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Method selector */}
            <div className="space-y-2">
              <span className="text-sm font-medium">跟进方式</span>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(FOLLOW_UP_METHOD_CONFIG).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={createForm.method === key ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1"
                    onClick={() => setCreateForm(prev => ({ ...prev, method: key as FollowUpMethod }))}
                  >
                    <span>{config.icon}</span> {config.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <span className="text-sm font-medium">跟进内容 *</span>
              <Textarea
                value={createForm.content}
                onChange={e => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="输入跟进内容..."
                rows={3}
              />
              <div className="flex gap-1 flex-wrap">
                {FOLLOW_UP_TEMPLATES.map((tpl, i) => (
                  <Button key={i} variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setCreateForm(prev => ({ ...prev, content: tpl }))}>
                    {tpl.slice(0, 10)}...
                  </Button>
                ))}
              </div>
            </div>

            {/* Next follow-up */}
            <div className="space-y-2">
              <span className="text-sm font-medium">下次跟进时间 (可选)</span>
              <input
                type="datetime-local"
                value={createForm.nextFollowUpAt}
                onChange={e => setCreateForm(prev => ({ ...prev, nextFollowUpAt: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>取消</Button>
            <Button onClick={handleCreate} disabled={!createForm.entityId || !createForm.content}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
