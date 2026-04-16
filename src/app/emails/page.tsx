'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Mail,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Send,
  Loader2,
  User,
  Building2,
  FileText,
} from 'lucide-react';

interface EmailLog {
  id: string;
  config_id: string;
  template_id: string;
  entity_type: string;
  entity_id: string;
  entity_name: string;
  to_email: string;
  to_name: string;
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed';
  error_message: string;
  sent_at: string;
  created_at: string;
}

const STATUS_CONFIG = {
  sent: { label: '已发送', color: 'text-green-600 bg-green-500/10', icon: CheckCircle },
  failed: { label: '失败', color: 'text-red-600 bg-red-500/10', icon: XCircle },
  pending: { label: '待发送', color: 'text-yellow-600 bg-yellow-500/10', icon: Clock },
};

const ENTITY_TYPE_CONFIG = {
  customer: { label: '客户', icon: Building2 },
  lead: { label: '销售线索', icon: User },
  opportunity: { label: '商机', icon: FileText },
  contact: { label: '联系人', icon: User },
};

export default function EmailHistoryPage() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [resending, setResending] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEntityType, setFilterEntityType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.set('status', filterStatus);
      if (filterEntityType !== 'all') params.set('entity_type', filterEntityType);
      params.set('limit', pageSize.toString());
      params.set('offset', (page * pageSize).toString());

      const response = await fetch(`/api/emails/logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('获取邮件历史失败:', error);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterEntityType, page, pageSize]);

  useEffect(() => {
    void fetchLogs();
  }, [fetchLogs]);

  const handleResend = async (logId: string) => {
    setResending(logId);
    try {
      const response = await fetch(`/api/emails/logs/${logId}`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchLogs();
      } else {
        const error = await response.json();
        alert(error.error || '重发失败');
      }
    } catch (error) {
      console.error('重发邮件失败:', error);
      alert('重发失败');
    } finally {
      setResending(null);
    }
  };

  const openDetail = (log: EmailLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.to_email.toLowerCase().includes(term) ||
      log.to_name?.toLowerCase().includes(term) ||
      log.subject.toLowerCase().includes(term) ||
      log.entity_name?.toLowerCase().includes(term)
    );
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8" />
            邮件历史
          </h1>
          <p className="text-muted-foreground mt-1">查看所有发送的邮件记录</p>
        </div>
        <Button variant="outline" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索收件人、主题..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="sent">已发送</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
            <SelectItem value="pending">待发送</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEntityType} onValueChange={setFilterEntityType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="关联类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {Object.entries(ENTITY_TYPE_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                {config.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Mail className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无邮件记录</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>收件人</TableHead>
                    <TableHead>主题</TableHead>
                    <TableHead>关联</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>发送时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const StatusIcon = STATUS_CONFIG[log.status]?.icon || Clock;
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{log.to_name || '-'}</span>
                            <span className="text-xs text-muted-foreground">{log.to_email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate" title={log.subject}>
                            {log.subject}
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.entity_type && log.entity_name ? (
                            <div className="flex items-center gap-1">
                              {ENTITY_TYPE_CONFIG[log.entity_type as keyof typeof ENTITY_TYPE_CONFIG]?.icon && (() => {
                                const EntityIcon = ENTITY_TYPE_CONFIG[log.entity_type as keyof typeof ENTITY_TYPE_CONFIG].icon;
                                return <EntityIcon className="h-4 w-4 text-muted-foreground" />;
                              })()}
                              <span className="text-sm">{log.entity_name}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`${STATUS_CONFIG[log.status]?.color || ''} gap-1`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {STATUS_CONFIG[log.status]?.label || log.status}
                          </Badge>
                          {log.status === 'failed' && log.error_message && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[150px] truncate">
                              {log.error_message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(log.sent_at || log.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDetail(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(log.id)}
                              disabled={resending !== null}
                            >
                              {resending === log.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    显示 {page * pageSize + 1} - {Math.min((page + 1) * pageSize, total)} 条，共 {total} 条
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      上一页
                    </Button>
                    <span className="text-sm">
                      第 {page + 1} / {totalPages} 页
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={page >= totalPages - 1}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* 邮件详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>邮件详情</DialogTitle>
            <DialogDescription>
              {selectedLog?.subject}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">收件人</p>
                  <p className="font-medium">
                    {selectedLog.to_name || '-'} &lt;{selectedLog.to_email}&gt;
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">状态</p>
                  <Badge
                    variant="secondary"
                    className={`${STATUS_CONFIG[selectedLog.status]?.color || ''}`}
                  >
                    {STATUS_CONFIG[selectedLog.status]?.label || selectedLog.status}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">关联类型</p>
                  <p>
                    {selectedLog.entity_type
                      ? ENTITY_TYPE_CONFIG[selectedLog.entity_type as keyof typeof ENTITY_TYPE_CONFIG]?.label || selectedLog.entity_type
                      : '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">关联名称</p>
                  <p>{selectedLog.entity_name || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">发送时间</p>
                  <p>{formatDate(selectedLog.sent_at)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">创建时间</p>
                  <p>{formatDate(selectedLog.created_at)}</p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-sm text-red-600 font-medium">错误信息</p>
                  <p className="text-sm text-red-600">{selectedLog.error_message}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">邮件内容</p>
                <div
                  className="p-4 bg-muted rounded-lg text-sm prose prose-sm max-w-none max-h-[300px] overflow-y-auto"
                  dangerouslySetInnerHTML={{
                    __html: selectedLog.body || '<p>无内容</p>',
                  }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
