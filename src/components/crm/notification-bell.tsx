'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { CRMNotification, NotificationType } from '@/lib/crm-types';

const notificationConfig: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  overdue: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/10' },
  reminder: { icon: Clock, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10' },
  stage_change: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
  info: { icon: Info, color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-500/10' },
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<CRMNotification[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/crm?type=unreadNotifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.map((n: Record<string, unknown>) => ({
          id: n.id,
          type: n.type as NotificationType,
          title: n.title,
          message: n.message,
          entityType: n.entity_type as string | undefined,
          entityId: n.entity_id as string | undefined,
          isRead: n.is_read as boolean,
          createdAt: n.created_at as string,
        })));
      }
    } catch {
      // 静默处理
    }
  }, []);

  // 检查逾期提醒
  const checkOverdue = useCallback(async () => {
    try {
      await fetch('/api/crm?type=checkOverdue');
      await fetchNotifications();
    } catch {
      // 静默处理
    }
  }, [fetchNotifications]);

  useEffect(() => {
    fetchNotifications();
    // 每5分钟检查逾期
    const interval = setInterval(() => {
      checkOverdue();
    }, 5 * 60 * 1000);
    // 首次加载后30秒检查一次
    const timer = setTimeout(checkOverdue, 30 * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [fetchNotifications, checkOverdue]);

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/crm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markNotificationRead', id, data: {} }),
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch {
      // 静默处理
    }
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/crm', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllNotificationsRead', id: 'all', data: {} }),
      });
      setNotifications([]);
    } catch {
      // 静默处理
    }
  };

  const unreadCount = notifications.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-[20px] p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 pb-2">
          <h4 className="font-semibold text-sm">通知</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
              <CheckCheck className="h-3 w-3 mr-1" />
              全部已读
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
              暂无新通知
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => {
                const config = notificationConfig[notification.type] || notificationConfig.info;
                const Icon = config.icon;
                return (
                  <div
                    key={notification.id}
                    className={cn('flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer', 'bg-accent/20')}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', config.bg)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: zhCN })}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0 mt-1" onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}>
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
