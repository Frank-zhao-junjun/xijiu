'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SalesOpportunity, FollowUp } from '@/lib/crm-types';

interface TodayTodoData {
  todayClosing: SalesOpportunity[];
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
}

interface TodayTodoCardProps {
  className?: string;
  onFollowUp?: (entityType: 'customer' | 'lead' | 'opportunity', entityId: string, entityName: string) => void;
}

export function TodayTodoCard({ className, onFollowUp }: TodayTodoCardProps) {
  const [todos, setTodos] = useState<TodayTodoData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm?type=todayTodos');
      if (res.ok) {
        const data = await res.json();
        setTodos({
          todayClosing: (data.todayClosing || []).map((o: Record<string, unknown>) => ({
            id: o.id as string,
            title: o.title as string,
            customerId: o.customer_id as string,
            customerName: o.customer_name as string,
            value: Number(o.value),
            stage: o.stage as string,
            probability: o.probability as number,
            expectedCloseDate: o.expected_close_date as string,
            createdAt: o.created_at as string,
            updatedAt: o.updated_at as string,
          })),
          todayFollowUps: (data.todayFollowUps || []).map((f: Record<string, unknown>) => ({
            id: f.id as string,
            entityType: f.entity_type as 'lead' | 'opportunity',
            entityId: f.entity_id as string,
            entityName: f.entity_name as string,
            type: f.type as string,
            method: f.method as string,
            content: f.content as string,
            scheduledAt: f.scheduled_at as string | null,
            completedAt: f.completed_at as string | null,
            nextFollowUpAt: f.next_follow_up_at as string | null,
            createdBy: f.created_by as string,
            isOverdue: false,
            createdAt: f.created_at as string,
            updatedAt: f.updated_at as string,
          })),
          overdueFollowUps: (data.overdueFollowUps || []).map((f: Record<string, unknown>) => ({
            id: f.id as string,
            entityType: f.entity_type as 'lead' | 'opportunity',
            entityId: f.entity_id as string,
            entityName: f.entity_name as string,
            type: f.type as string,
            method: f.method as string,
            content: f.content as string,
            scheduledAt: f.scheduled_at as string | null,
            completedAt: f.completed_at as string | null,
            nextFollowUpAt: f.next_follow_up_at as string | null,
            createdBy: f.created_by as string,
            isOverdue: true,
            createdAt: f.created_at as string,
            updatedAt: f.updated_at as string,
          })),
        });
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const totalCount = todos ? todos.todayClosing.length + todos.todayFollowUps.length + todos.overdueFollowUps.length : 0;

  return (
    <Card className={cn('card-hover', className)}>
      <CardHeader className="relative">
        <div className="absolute -left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-red-500 rounded-full" />
        <CardTitle className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          </div>
          今日待办
          {totalCount > 0 && (
            <Badge variant="destructive" className="ml-2">{totalCount}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !todos || totalCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <p className="text-sm text-muted-foreground">今日无待办事项</p>
            <p className="text-xs text-muted-foreground/60 mt-1">所有任务已完成</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 今日应成交 */}
            {todos.todayClosing.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">今日应成交</span>
                  <Badge variant="secondary" className="text-xs">{todos.todayClosing.length}</Badge>
                </div>
                <div className="space-y-2">
                  {todos.todayClosing.map(opp => (
                    <div key={opp.id} className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{opp.title}</p>
                        <p className="text-xs text-muted-foreground">{opp.customerName}</p>
                      </div>
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 ml-2">¥{opp.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 今日应跟进 */}
            {todos.todayFollowUps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">今日应跟进</span>
                  <Badge variant="secondary" className="text-xs">{todos.todayFollowUps.length}</Badge>
                </div>
                <div className="space-y-2">
                  {todos.todayFollowUps.map(fu => (
                    <div key={fu.id} className="flex items-center justify-between p-2 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200/50 dark:border-orange-900/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fu.entityName}</p>
                        <p className="text-xs text-muted-foreground truncate">{fu.content}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs ml-2" onClick={() => onFollowUp?.(fu.entityType, fu.entityId, fu.entityName)}>
                        跟进
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 逾期未跟进 */}
            {todos.overdueFollowUps.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">逾期未跟进</span>
                  <Badge variant="destructive" className="text-xs">{todos.overdueFollowUps.length}</Badge>
                </div>
                <div className="space-y-2">
                  {todos.overdueFollowUps.map(fu => (
                    <div key={fu.id} className="flex items-center justify-between p-2 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fu.entityName}</p>
                        <p className="text-xs text-red-600 dark:text-red-400">跟进已逾期</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs ml-2 text-red-600" onClick={() => onFollowUp?.(fu.entityType, fu.entityId, fu.entityName)}>
                        立即跟进
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
