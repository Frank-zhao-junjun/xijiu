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
import { Plus, Search, FileText, Trash2, Building2, Briefcase, FileBarChart } from 'lucide-react';
import Link from 'next/link';
import { CONTRACT_STATUS_CONFIG, type Contract, type ContractStatus } from '@/lib/crm-types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/contracts');
      if (res.ok) {
        const data = await res.json();
        setContracts(data.map((c: Record<string, unknown>) => ({
          id: c.id as string,
          contractNumber: c.contract_number as string,
          customerId: c.customer_id as string | undefined,
          customerName: c.customer_name as string | undefined,
          opportunityId: c.opportunity_id as string | undefined,
          opportunityName: c.opportunity_name as string | undefined,
          quoteId: c.quote_id as string | undefined,
          quoteTitle: c.quote_title as string | undefined,
          status: c.status as ContractStatus,
          amount: Number(c.amount),
          signingDate: c.signing_date as string | undefined,
          effectiveDate: c.effective_date as string | undefined,
          expirationDate: c.expiration_date as string | undefined,
          terms: c.terms as string | undefined,
          customTerms: c.custom_terms as string | undefined,
          notes: c.notes as string | undefined,
          createdAt: c.created_at as string,
          updatedAt: c.updated_at as string,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const filteredContracts = contracts.filter(c => {
    const matchSearch = !search || 
      c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
      (c.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: deleteId }),
      });
      setDeleteId(null);
      fetchContracts();
    } catch { /* silent */ }
  };

  const stats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    executing: contracts.filter(c => c.status === 'executing').length,
    completed: contracts.filter(c => c.status === 'completed').length,
    terminated: contracts.filter(c => c.status === 'terminated').length,
    totalAmount: contracts.reduce((s, c) => s + c.amount, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">合同管理</h1>
          <p className="text-muted-foreground mt-1">共 {filteredContracts.length} 个合同</p>
        </div>
        <Button onClick={() => router.push('/contracts/new')} className="gap-2">
          <Plus className="h-4 w-4" /> 新建合同
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
        <Card className="card-hover relative overflow-hidden cursor-pointer" onClick={() => setStatusFilter('executing')}>
          <div className="absolute inset-0 bg-blue-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">执行中</p>
            <p className="text-2xl font-bold text-blue-600">{stats.executing}</p>
          </CardContent>
        </Card>
        <Card className="card-hover relative overflow-hidden cursor-pointer" onClick={() => setStatusFilter('completed')}>
          <div className="absolute inset-0 bg-green-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">已完成</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="card-hover relative overflow-hidden">
          <div className="absolute inset-0 bg-red-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">已终止</p>
            <p className="text-2xl font-bold text-red-600">{stats.terminated}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索合同编号或客户..."
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
            <SelectItem value="executing">执行中</SelectItem>
            <SelectItem value="completed">已完成</SelectItem>
            <SelectItem value="terminated">已终止</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-blue-500/10 flex items-center justify-center mb-4">
              <FileBarChart className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">暂无合同</h3>
            <p className="text-sm text-muted-foreground mb-4">开始创建你的第一个合同</p>
            <Button onClick={() => router.push('/contracts/new')} className="gap-2">
              <Plus className="h-4 w-4" /> 新建合同
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">合同编号</TableHead>
                <TableHead className="font-semibold">客户</TableHead>
                <TableHead className="font-semibold">关联报价单</TableHead>
                <TableHead className="font-semibold">状态</TableHead>
                <TableHead className="text-right font-semibold">金额</TableHead>
                <TableHead className="font-semibold">到期日</TableHead>
                <TableHead className="w-[80px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => {
                const statusConf = CONTRACT_STATUS_CONFIG[contract.status];
                return (
                  <TableRow
                    key={contract.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/contracts/${contract.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileBarChart className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium">{contract.contractNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {contract.customerName ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          {contract.customerName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contract.quoteTitle ? (
                        <Link
                          href={`/quotes/${contract.quoteId}`}
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                          onClick={e => e.stopPropagation()}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {contract.quoteTitle}
                        </Link>
                      ) : contract.opportunityName ? (
                        <Link
                          href={`/opportunities/${contract.opportunityId}`}
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                          onClick={e => e.stopPropagation()}
                        >
                          <Briefcase className="h-3.5 w-3.5" />
                          查看商机
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusConf.className, "text-xs")}>
                        {statusConf.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ¥{contract.amount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {contract.expirationDate ? format(new Date(contract.expirationDate), 'yyyy-MM-dd') : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={e => { e.stopPropagation(); setDeleteId(contract.id); }}
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
            <DialogDescription>确定要删除这个合同吗？此操作不可撤销。</DialogDescription>
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
