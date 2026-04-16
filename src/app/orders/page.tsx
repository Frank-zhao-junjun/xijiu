'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogDescription,
  DialogFooter,
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
import { Plus, Search, Package, Trash2, MoreVertical, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ORDER_STATUS_CONFIG, type Order, type OrderStatus } from '@/lib/crm-types';
import { format } from 'date-fns';
import Link from 'next/link';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.map((o: Record<string, unknown>) => ({
          id: o.id as string,
          quoteId: o.quote_id as string | undefined,
          quoteNumber: o.quote_number as string | undefined,
          opportunityId: o.opportunity_id as string,
          opportunityName: o.opportunity_name as string | undefined,
          customerId: o.customer_id as string,
          customerName: o.customer_name as string | undefined,
          orderNumber: o.order_number as string,
          status: o.status as OrderStatus,
          paymentMethod: o.payment_method as Order['paymentMethod'],
          orderDate: o.order_date as string | undefined,
          deliveryDate: o.delivery_date as string | undefined,
          subtotal: Number(o.subtotal),
          discount: Number(o.discount),
          tax: Number(o.tax),
          total: Number(o.total),
          notes: o.notes as string | undefined,
          createdAt: o.created_at as string,
          updatedAt: o.updated_at as string,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { void fetchOrders(); }, []);

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = async (action: string, id: string) => {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: { id } }),
      });
      fetchOrders();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/orders?id=${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      fetchOrders();
    } catch { /* silent */ }
  };

  // Stats
  const stats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'draft').length,
    active: orders.filter(o => ['confirmed', 'awaiting_payment', 'paid'].includes(o.status)).length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalRevenue: orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.total, 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight gradient-text">成交订单</h1>
          <p className="text-muted-foreground mt-1">管理已成交的订单，订单状态: 草稿→已确认→待付款→已付款→已完成</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link href="/orders/new">
              <Plus className="h-4 w-4" />
              新建订单
            </Link>
          </Button>
        </div>
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
        <Card className="card-hover relative overflow-hidden cursor-pointer" onClick={() => setStatusFilter('confirmed')}>
          <div className="absolute inset-0 bg-blue-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">进行中</p>
            <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="card-hover relative overflow-hidden cursor-pointer" onClick={() => setStatusFilter('completed')}>
          <div className="absolute inset-0 bg-emerald-500/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">已完成</p>
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
          </CardContent>
        </Card>
        <Card className="card-hover relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5" />
          <CardContent className="relative p-4">
            <p className="text-xs text-muted-foreground">完成总额</p>
            <p className="text-lg font-bold text-primary">¥{stats.totalRevenue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索订单号或客户..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="筛选状态" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            {Object.entries(ORDER_STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无订单</p>
              <Button variant="outline" className="mt-4 gap-2" asChild>
                <Link href="/orders/new">
                  <Plus className="h-4 w-4" /> 新建订单
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单编号</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>客户</TableHead>
                  <TableHead>总金额</TableHead>
                  <TableHead>订单日期</TableHead>
                  <TableHead>交付日期</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusConf = ORDER_STATUS_CONFIG[order.status];
                  return (
                    <TableRow key={order.id} className="group cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                      <TableCell className="font-mono font-medium">{order.orderNumber}</TableCell>
                      <TableCell><Badge className={statusConf.className}>{statusConf.label}</Badge></TableCell>
                      <TableCell className="text-muted-foreground">{order.customerName || '-'}</TableCell>
                      <TableCell className="font-medium">¥{order.total.toLocaleString()}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{order.orderDate ? format(new Date(order.orderDate), 'yyyy/MM/dd') : '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{order.deliveryDate ? format(new Date(order.deliveryDate), 'yyyy/MM/dd') : '-'}</TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}`} className="gap-2">
                                <Package className="h-4 w-4" /> 查看详情
                              </Link>
                            </DropdownMenuItem>
                            {order.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleAction('confirm', order.id)} className="gap-2">
                                <CheckCircle className="h-4 w-4" /> 确认订单
                              </DropdownMenuItem>
                            )}
                            {order.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleAction('awaiting_payment', order.id)} className="gap-2">
                                <ArrowRight className="h-4 w-4" /> 标记待付款
                              </DropdownMenuItem>
                            )}
                            {order.status === 'awaiting_payment' && (
                              <DropdownMenuItem onClick={() => handleAction('paid', order.id)} className="gap-2">
                                <CheckCircle className="h-4 w-4" /> 标记已付款
                              </DropdownMenuItem>
                            )}
                            {order.status === 'paid' && (
                              <DropdownMenuItem onClick={() => handleAction('complete', order.id)} className="gap-2">
                                <CheckCircle className="h-4 w-4" /> 完成订单
                              </DropdownMenuItem>
                            )}
                            {['draft', 'confirmed', 'awaiting_payment', 'paid'].includes(order.status) && (
                              <DropdownMenuItem onClick={() => handleAction('cancel', order.id)} className="gap-2 text-red-600">
                                <XCircle className="h-4 w-4" /> 取消订单
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}/edit`} className="gap-2">
                                <ArrowRight className="h-4 w-4" /> 编辑订单
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeleteId(order.id)} className="gap-2 text-red-600">
                              <Trash2 className="h-4 w-4" /> 删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-red-500" /> 确认删除</DialogTitle>
            <DialogDescription>确定要删除这个订单吗？此操作不可撤销。</DialogDescription>
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
