'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, FileText, MoreVertical, Trash2, Eye, Edit, Printer } from 'lucide-react';
import { INVOICE_STATUS_CONFIG, type Invoice, type InvoiceStatus } from '@/lib/crm-types';
import { format } from 'date-fns';
import Link from 'next/link';

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.map((o: Record<string, unknown>) => ({
          id: o.id as string,
          invoiceNumber: o.invoice_number as string,
          orderId: o.order_id as string | undefined,
          orderNumber: o.order_number as string | undefined,
          customerId: o.customer_id as string,
          customerName: o.customer_name as string,
          taxId: o.tax_id as string | undefined,
          billingAddress: o.billing_address as string | undefined,
          status: o.status as InvoiceStatus,
          issueDate: o.issue_date as string,
          dueDate: o.due_date as string | undefined,
          subtotal: Number(o.subtotal),
          taxRate: Number(o.tax_rate) || 0.06,
          tax: Number(o.tax),
          total: Number(o.total),
          paidDate: o.paid_date as string | undefined,
          paymentMethod: o.payment_method as Invoice['paymentMethod'],
          notes: o.notes as string | undefined,
          createdAt: o.created_at as string,
          updatedAt: o.updated_at as string,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const filteredInvoices = invoices.filter(o => {
    const matchesSearch = 
      o.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 统计
  const stats = {
    all: invoices.length,
    draft: invoices.filter(i => i.status === 'draft').length,
    issued: invoices.filter(i => i.status === 'issued').length,
    paid: invoices.filter(i => i.status === 'paid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/invoices?id=${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchInvoices();
    } catch { /* silent */ }
  };

  const handleAction = async (action: string, id: string) => {
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', data: { id, status: action } }),
      });
      fetchInvoices();
    } catch { /* silent */ }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">发票管理</h1>
          <p className="text-muted-foreground">管理销售发票和收款记录</p>
        </div>
        <Button onClick={() => router.push('/invoices/new')}>
          <Plus className="mr-2 h-4 w-4" />
          新建发票
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'all' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.all}</div>
            <p className="text-xs text-muted-foreground">全部发票</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'draft' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('draft')}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.draft}</div>
            <p className="text-xs text-muted-foreground">草稿</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'issued' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('issued')}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.issued}</div>
            <p className="text-xs text-muted-foreground">已开票</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'paid' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('paid')}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.paid}</div>
            <p className="text-xs text-muted-foreground">已收款</p>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer hover:shadow-md transition-shadow ${statusFilter === 'overdue' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setStatusFilter('overdue')}
        >
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">逾期</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索发票号、客户名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>发票号</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>订单号</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>开票日期</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : filteredInvoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无发票记录
                  </TableCell>
                </TableRow>
              ) : (
                filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      <Link href={`/invoices/${invoice.id}`} className="hover:underline">
                        {invoice.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell>{invoice.orderNumber || '-'}</TableCell>
                    <TableCell className="font-semibold">
                      ¥{invoice.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge className={INVOICE_STATUS_CONFIG[invoice.status].className}>
                        {INVOICE_STATUS_CONFIG[invoice.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>{format(new Date(invoice.issueDate), 'yyyy-MM-dd')}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              查看详情
                            </Link>
                          </DropdownMenuItem>
                          {invoice.status === 'draft' && (
                            <DropdownMenuItem asChild>
                              <Link href={`/invoices/${invoice.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                编辑
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" />
                            打印
                          </DropdownMenuItem>
                          {invoice.status === 'draft' && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleAction('issued', invoice.id)}
                              >
                                <FileText className="mr-2 h-4 w-4" />
                                开票
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => setDeleteId(invoice.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除这张发票吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
