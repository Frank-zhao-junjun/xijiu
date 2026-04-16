'use client';

import { useState } from 'react';
import { Phone, Mail, Users, FileText, Calendar, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FollowUpType } from '@/lib/crm-types';

interface QuickFollowUpProps {
  entityType: 'customer' | 'lead' | 'opportunity';
  entityId: string;
  entityName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const followUpTypes: { value: FollowUpType; label: string; icon: typeof Phone }[] = [
  { value: 'call', label: '电话', icon: Phone },
  { value: 'email', label: '邮件', icon: Mail },
  { value: 'meeting', label: '会议', icon: Users },
  { value: 'note', label: '备注', icon: FileText },
];

export function QuickFollowUp({ entityType, entityId, entityName, open, onOpenChange, onSuccess }: QuickFollowUpProps) {
  const [type, setType] = useState<FollowUpType>('note');
  const [content, setContent] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/crm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'createFollowUp',
          data: {
            entityType,
            entityId,
            entityName,
            type,
            content: content.trim(),
            scheduledAt: scheduledAt || null,
          },
        }),
      });
      if (res.ok) {
        setContent('');
        setScheduledAt('');
        setType('note');
        onOpenChange(false);
        onSuccess?.();
      }
    } catch {
      // 错误已处理
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 flex items-center justify-center">
              <Send className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            快捷跟进
          </DialogTitle>
          <DialogDescription>
            为 &ldquo;{entityName}&rdquo; 添加跟进记录
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 跟进类型 */}
          <div className="space-y-2">
            <Label>跟进方式</Label>
            <div className="grid grid-cols-4 gap-2">
              {followUpTypes.map(t => {
                const Icon = t.icon;
                return (
                  <Button
                    key={t.value}
                    variant={type === t.value ? 'default' : 'outline'}
                    size="sm"
                    className="flex flex-col gap-1 h-auto py-2"
                    onClick={() => setType(t.value)}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-xs">{t.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* 跟进内容 */}
          <div className="space-y-2">
            <Label>跟进内容</Label>
            <Textarea
              placeholder="记录跟进详情..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* 计划跟进时间 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              计划跟进时间（可选，设置后到期提醒）
            </Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!content.trim() || loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            添加跟进
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
