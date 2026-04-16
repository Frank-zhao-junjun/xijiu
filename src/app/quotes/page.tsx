'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, Search, FileText, Trash2, Building2, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { QUOTE_STATUS_CONFIG, type Quote, type QuoteStatus } from '@/lib/crm-types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/quotes');
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.map((q: Record<string, unknown>) => ({
          id: q.id as string,
          opportunityId: q.opportunity_id as string,
          customerId: q.customer_id as string | undefined,
          customerName: q.customer_name as string | undefined,
          title: q.title as string,
          version: Number(q.version) || 1,
          revisionReason: q.revision_reason as string | undefined,
          status: q.status as QuoteStatus,
          validFrom: q.valid_from as string | undefined,
          validUntil: q.valid_until as string | undefined,
          subtotal: Number(q.subtotal),
          discount: Number(q.discount),
          tax: Number(q.tax),
          total: Number(q.total),
          terms: q.terms as string | undefined,
          notes: q.notes as string | undefined,
          createdAt: q.created_at as string,
          updatedAt: q.updated_at as string,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const filteredQuotes = quotes.filter(q => {
    const matchSearch = !search || 
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/quotes?id=${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchQuotes();
    } catch { /* silent */ }
  };

  const stats = {
    total: quotes.length,
    draft: quotes.filter(q => q.status === 'draft').length,
    active: quotes.filter(q => q.status === 'active').length,
    accepted: quotes.filter(q => q.status === 'accepted').length,
    totalValue: quotes.filter(q => q.status === 'accepted').reduce((s, q) => s + q.total, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">报价单</h1>
          <p className="text-muted-foreground mt-1">共 {filteredQuotes.length} 个报价单</p>
        </div>
        <Button onClick={() => router.push('/quotes/new')} className="gap-2">
          <Plus className="h-4 w-4" /> 新建报价单
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-5">
        <Card className="card-hover relative overflow-hidden cursor-pointer" onClick={() => setStatusFilter('all')}>
          <div className="absolute inset-0 bg-gray-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">全部</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="card-hover relative overflow-hidden cursor-pointer" onClick={() => setStatusFilter('draft')}>
          <div className="absolute inset-0 bg-gray-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">草稿</p>
            <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
          </CardContent>
        </Card>
        <Card className="card-hover relative overflow-hidden cursor-pointer" onClick={() => setStatusFilter('active')}>
          <div className="absolute inset-0 bg-blue-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">已发送</p>
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="card-hover relative overflow-hidden cursor-pointer" onClick={() => setStatusFilter('accepted')}>
          <div className="absolute inset-0 bg-green-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">已接受</p>
            <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
          </CardContent>
        </Card>
        <Card className="card-hover relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">已接受总额</p>
            <p className="text-lg font-bold text-primary">¥{stats.totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索报价单标题或客户..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
            <SelectItem value="active">已发送</SelectItem>
            <SelectItem value="accepted">已接受</SelectItem>
            <SelectItem value="rejected">已拒绝</SelectItem>
            <SelectItem value="expired">已过期</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredQuotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">暂无报价单</h3>
            <p className="text-sm text-muted-foreground mb-4">开始创建你的第一个报价单</p>
            <Button onClick={() => router.push('/quotes/new')} className="gap-2">
              <Plus className="h-4 w-4" /> 新建报价单
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">报价单</TableHead>
                <TableHead className="font-semibold">客户</TableHead>
                <TableHead className="font-semibold">商机</TableHead>
                <TableHead className="font-semibold">版本</TableHead>
                <TableHead className="font-semibold">状态</TableHead>
                <TableHead className="text-right font-semibold">金额</TableHead>
                <TableHead className="font-semibold">创建时间</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotes.map((quote) => {
                const statusConf = QUOTE_STATUS_CONFIG[quote.status];
                return (
                  <TableRow
                    key={quote.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/quotes/${quote.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{quote.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {quote.customerName ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {quote.customerName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/opportunities/${quote.opportunityId}`}
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                        onClick={e => e.stopPropagation()}
                      >
                        <Briefcase className="h-3.5 w-3.5" />
                        查看商机
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        quote.version > 1
                          ? "bg-purple-50 text-purple-600 border-purple-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      )}>
                        V{quote.version}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusConf.className, "text-xs")}>
                        {statusConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{quote.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(quote.createdAt), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={e => { e.stopPropagation(); setDeleteId(quote.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> 确认删除
            </DialogTitle>
            <DialogDescription>确定要删除这个报价单吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
