'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
import { ArrowLeft, Package, CheckCircle, XCircle, ArrowRight, Edit, Trash2, Building2, Briefcase, FileText, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { ORDER_STATUS_CONFIG, type Order, type OrderStatus } from '@/lib/crm-types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder({
            id: data.id,
            quoteId: data.quote_id,
            quoteNumber: data.quote_number,
            opportunityId: data.opportunity_id,
            opportunityName: data.opportunity_name,
            customerId: data.customer_id,
            customerName: data.customer_name,
            orderNumber: data.order_number,
            status: data.status as OrderStatus,
            paymentMethod: data.payment_method,
            orderDate: data.order_date,
            deliveryDate: data.delivery_date,
            subtotal: Number(data.subtotal),
            discount: Number(data.discount),
            tax: Number(data.tax),
            total: Number(data.total),
            notes: data.notes,
            items: (data.items || []).map((i: Record<string, unknown>) => ({
              id: i.id as string,
              orderId: i.order_id as string,
              productName: i.product_name as string,
              description: i.description as string | undefined,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unit_price),
              discount: Number(i.discount) || 0,
              subtotal: Number(i.subtotal),
              sortOrder: i.sort_order as number,
            })),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          });
        }
      } catch { /* silent */ }
    };
    if (id) fetchOrder();
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data: { id } }),
      });
      // Refresh
      const res = await fetch(`/api/orders?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(prev => prev ? { ...prev, status: data.status as OrderStatus } : prev);
      }
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
      router.push('/orders');
    } catch { /* silent */ }
  };

  if (!order) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  const statusConf = ORDER_STATUS_CONFIG[order.status];
  const isEditable = ['draft', 'confirmed', 'awaiting_payment', 'paid'].includes(order.status);

  // Payment method labels
  const paymentMethodLabels: Record<string, string> = {
    bank_transfer: '银行转账',
    cash: '现金',
    credit_card: '信用卡',
    other: '其他',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/orders')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight font-mono">{order.orderNumber}</h1>
              <Badge className={statusConf.className}>{statusConf.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">创建于 {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isEditable && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/orders/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" /> 编辑
                </Link>
              </Button>
            </>
          )}
          {/* Status Actions */}
          {order.status === 'draft' && (
            <Button onClick={() => handleAction('confirm')} className="gap-2 bg-blue-600 hover:bg-blue-700">
              <CheckCircle className="h-4 w-4" /> 确认订单
            </Button>
          )}
          {order.status === 'confirmed' && (
            <>
              <Button onClick={() => handleAction('awaiting_payment')} className="gap-2 bg-orange-600 hover:bg-orange-700">
                <ArrowRight className="h-4 w-4" /> 标记待付款
              </Button>
            </>
          )}
          {order.status === 'awaiting_payment' && (
            <Button onClick={() => handleAction('paid')} className="gap-2 bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4" /> 确认已付款
            </Button>
          )}
          {order.status === 'paid' && (
            <Button onClick={() => handleAction('complete')} className="gap-2 bg-gradient-to-r from-emerald-500 to-green-600">
              <CheckCircle className="h-4 w-4" /> 完成订单
            </Button>
          )}
          {['draft', 'confirmed', 'awaiting_payment', 'paid'].includes(order.status) && (
            <Button variant="destructive" onClick={() => handleAction('cancel')} className="gap-2">
              <XCircle className="h-4 w-4" /> 取消
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Progress */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {['draft', 'confirmed', 'awaiting_payment', 'paid', 'completed'].map((status, idx) => {
              const conf = ORDER_STATUS_CONFIG[status as OrderStatus];
              const isActive = order.status === status;
              const isPast = conf.step < ORDER_STATUS_CONFIG[order.status].step;
              return (
                <div key={status} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                      isActive ? "bg-primary text-primary-foreground shadow-lg" :
                      isPast ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    )}>
                      {isPast ? <CheckCircle className="h-4 w-4" /> : idx + 1}
                    </div>
                    <span className={cn("text-xs mt-1", isActive ? "text-primary font-medium" : "text-muted-foreground")}>
                      {conf.label}
                    </span>
                  </div>
                  {idx < 4 && (
                    <div className={cn(
                      "w-16 h-0.5 mx-2",
                      isPast ? "bg-green-500" : "bg-gray-200"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> 订单明细</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>产品名称</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">折扣</TableHead>
                    <TableHead className="text-right">小计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(order.items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-red-500">{item.discount > 0 ? `-¥${item.discount}` : '-'}</TableCell>
                      <TableCell className="text-right font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader><CardTitle>备注</CardTitle></CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card>
            <CardHeader><CardTitle>金额汇总</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">小计</span>
                <span>¥{order.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">折扣</span>
                <span className="text-red-500">-¥{order.discount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">税额(6%)</span>
                <span>¥{order.tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>总计</span>
                <span className="text-primary">¥{order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader><CardTitle>订单信息</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {order.customerName && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">客户</p>
                    <p className="font-medium">{order.customerName}</p>
                  </div>
                </div>
              )}
              {order.opportunityName && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">商机</p>
                    <p className="font-medium">{order.opportunityName}</p>
                  </div>
                </div>
              )}
              {order.quoteNumber && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">来源报价单</p>
                    <p className="font-medium font-mono">{order.quoteNumber}</p>
                  </div>
                </div>
              )}
              {order.orderDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">订单日期</p>
                    <p className="font-medium">{format(new Date(order.orderDate), 'yyyy-MM-dd')}</p>
                  </div>
                </div>
              )}
              {order.deliveryDate && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">预计交付日期</p>
                    <p className="font-medium">{format(new Date(order.deliveryDate), 'yyyy-MM-dd')}</p>
                  </div>
                </div>
              )}
              {order.paymentMethod && (
                <div className="flex items-start gap-3">
                  <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">付款方式</p>
                    <p className="font-medium">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-5 w-5 text-red-500" /> 确认删除</DialogTitle>
            <DialogDescription>确定要删除这个订单吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
