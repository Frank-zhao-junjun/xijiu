'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Phone, Mail, Users, FileText, Plus, Clock, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { FOLLOW_UP_METHOD_CONFIG, FOLLOW_UP_TEMPLATES, type FollowUpMethod, type FollowUp } from '@/lib/crm-types';

const methodIcons: Record<FollowUpMethod, typeof Phone> = {
  phone: Phone,
  wechat: Mail,
  email: Mail,
  meeting: Users,
  other: FileText,
};

interface FollowUpTimelineProps {
  entityType: 'customer' | 'lead' | 'opportunity';
  entityId: string;
  entityName: string;
  onChange?: () => void;
}

export function FollowUpTimeline({ entityType, entityId, entityName, onChange }: FollowUpTimelineProps) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    method: 'phone' as FollowUpMethod,
    content: '',
    nextFollowUpAt: '',
  });

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm?type=followUps&entityType=${entityType}&entityId=${entityId}`);
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
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => { fetchFollowUps(); }, [fetchFollowUps]);

  const handleCreate = async () => {
    try {
      await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createFollowUp',
          data: {
            entityType,
            entityId,
            entityName,
            type: createForm.method === 'phone' ? 'call' : createForm.method === 'meeting' ? 'meeting' : 'note',
            method: createForm.method,
            content: createForm.content,
            nextFollowUpAt: createForm.nextFollowUpAt || null,
          },
        }),
      });
      setShowCreate(false);
      setCreateForm({ method: 'phone', content: '', nextFollowUpAt: '' });
      fetchFollowUps();
      onChange?.();
    } catch { /* silent */ }
  };

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            跟进记录
            <Badge variant="secondary" className="ml-1">{followUps.length}</Badge>
          </CardTitle>
          <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
            <Plus className="h-3 w-3" /> 新建跟进
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : followUps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">暂无跟进记录</p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4">
            {/* Timeline line */}
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />

            {followUps.map((fu) => {
              const methodConf = FOLLOW_UP_METHOD_CONFIG[fu.method] || FOLLOW_UP_METHOD_CONFIG.other;
              const IconComp = methodIcons[fu.method] || FileText;
              const isCompleted = !!fu.completedAt;

              return (
                <div key={fu.id} className="relative">
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute -left-6 top-1 w-4 h-4 rounded-full flex items-center justify-center border-2",
                    isCompleted ? "bg-green-500 border-green-500" :
                    fu.isOverdue ? "bg-red-500 border-red-500" :
                    "bg-primary border-primary"
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>

                  <div className={cn(
                    "p-3 rounded-lg border transition-colors",
                    fu.isOverdue && "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20"
                  )}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <IconComp className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-medium">{methodConf.label}</span>
                        {isCompleted && <Badge variant="outline" className="text-xs text-green-600">已完成</Badge>}
                        {fu.isOverdue && !isCompleted && <Badge variant="destructive" className="text-xs">逾期</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(fu.createdAt), { addSuffix: true, locale: zhCN })}
                        </span>
                        {!isCompleted && (
                          <Button variant="ghost" size="sm" className="h-6 text-xs gap-1" onClick={() => handleComplete(fu.id)}>
                            <Check className="h-3 w-3" /> 完成
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm">{fu.content}</p>
                    {fu.nextFollowUpAt && !isCompleted && (
                      <p className="text-xs text-muted-foreground mt-1">
                        下次跟进: {formatDistanceToNow(new Date(fu.nextFollowUpAt), { addSuffix: true, locale: zhCN })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新建跟进 - {entityName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
              <span className="text-sm font-medium">跟进内容</span>
              <Textarea
                value={createForm.content}
                onChange={e => setCreateForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="输入跟进内容..."
                rows={3}
              />
              {/* Templates */}
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
            <Button onClick={handleCreate} disabled={!createForm.content}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
