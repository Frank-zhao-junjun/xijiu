'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { ArrowLeft, Plus, X, Package } from 'lucide-react';
import Link from 'next/link';
import { ORDER_STATUS_CONFIG, type Order, type OrderStatus } from '@/lib/crm-types';

interface OrderItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    orderDate: '',
    deliveryDate: '',
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'cash' | 'credit_card' | 'other',
    notes: '',
  });
  const [items, setItems] = useState<OrderItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 },
  ]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          const mappedOrder: Order = {
            id: data.id,
            quoteId: data.quote_id,
            quoteNumber: data.quote_number,
            opportunityId: data.opportunity_id,
            opportunityName: data.opportunity_name,
            customerId: data.customer_id,
            customerName: data.customer_name,
            orderNumber: data.order_number,
            status: data.status as OrderStatus,
            paymentMethod: data.payment_method as Order['paymentMethod'],
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
          };
          setOrder(mappedOrder);
          setForm({
            orderDate: mappedOrder.orderDate || '',
            deliveryDate: mappedOrder.deliveryDate || '',
            paymentMethod: mappedOrder.paymentMethod || 'bank_transfer',
            notes: mappedOrder.notes || '',
          });
          setItems(
            (mappedOrder.items || []).length > 0
              ? mappedOrder.items!.map(i => ({
                  productName: i.productName,
                  description: i.description || '',
                  quantity: i.quantity,
                  unitPrice: i.unitPrice,
                  discount: i.discount,
                  subtotal: i.subtotal,
                }))
              : [{ productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }]
          );
        }
      } catch { /* silent */ }
    };
    if (id) fetchOrder();
  }, [id]);

  const updateItem = (index: number, field: keyof OrderItemForm, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (['quantity', 'unitPrice', 'discount'].includes(field)) {
        const q = field === 'quantity' ? Number(value) : updated[index].quantity;
        const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
        const d = field === 'discount' ? Number(value) : updated[index].discount;
        updated[index].subtotal = q * p - d;
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const taxRate = 0.06;
  const tax = (subtotal - totalDiscount) * taxRate;
  const total = subtotal - totalDiscount + tax;

  const handleSubmit = async () => {
    if (!order || items.filter(i => i.productName).length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          data: {
            orderDate: form.orderDate || null,
            deliveryDate: form.deliveryDate || null,
            paymentMethod: form.paymentMethod,
            subtotal,
            discount: totalDiscount,
            tax,
            total,
            notes: form.notes,
            items: items.filter(i => i.productName).map((i, idx) => ({
              productName: i.productName,
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount,
              subtotal: i.subtotal,
              sortOrder: idx,
            })),
          },
        }),
      });
      if (res.ok) {
        router.push(`/orders/${id}`);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (!order) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  const statusConf = ORDER_STATUS_CONFIG[order.status];
  const isEditable = ['draft', 'confirmed', 'awaiting_payment', 'paid'].includes(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/orders/${id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold font-mono">编辑订单</h2>
            <Badge className={statusConf.className}>{statusConf.label}</Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            订单号: {order.orderNumber}
          </p>
        </div>
      </div>

      {!isEditable ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">此订单状态不允许编辑</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/orders/${id}`)}>
              返回详情页
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" /> 订单信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>客户名称</Label>
                    <Input value={order.customerName || ''} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>商机名称</Label>
                    <Input value={order.opportunityName || ''} disabled className="bg-muted" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>订单日期</Label>
                    <Input type="date" value={form.orderDate} onChange={e => setForm(prev => ({ ...prev, orderDate: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>预计交付日期</Label>
                    <Input type="date" value={form.deliveryDate} onChange={e => setForm(prev => ({ ...prev, deliveryDate: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>付款方式</Label>
                  <Select value={form.paymentMethod} onValueChange={v => setForm(prev => ({ ...prev, paymentMethod: v as typeof form.paymentMethod }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">银行转账</SelectItem>
                      <SelectItem value="cash">现金</SelectItem>
                      <SelectItem value="credit_card">信用卡</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" /> 订单明细
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>产品明细</Label>
                  <Button variant="outline" size="sm" className="gap-1" onClick={addItem}>
                    <Plus className="h-3 w-3" /> 添加产品
                  </Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>产品名称</TableHead>
                        <TableHead className="w-[80px]">数量</TableHead>
                        <TableHead className="w-[100px]">单价</TableHead>
                        <TableHead className="w-[80px]">折扣</TableHead>
                        <TableHead className="w-[100px]">小计</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Input 
                              value={item.productName} 
                              onChange={e => updateItem(idx, 'productName', e.target.value)} 
                              placeholder="产品名称" 
                              className="h-8" 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.quantity} 
                              onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} 
                              className="h-8" 
                              min={1} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.unitPrice} 
                              onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} 
                              className="h-8" 
                              min={0} 
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              value={item.discount} 
                              onChange={e => updateItem(idx, 'discount', Number(e.target.value))} 
                              className="h-8" 
                              min={0} 
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            ¥{item.subtotal.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {items.length > 1 && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItem(idx)}>
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="flex justify-end">
                  <div className="text-right space-y-1 w-64">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">小计:</span>
                      <span>¥{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">折扣:</span>
                      <span className="text-red-500">-¥{totalDiscount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">税额(6%):</span>
                      <span>¥{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>总计:</span>
                      <span className="text-primary">¥{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>备注</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={form.notes} 
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} 
                  placeholder="订单备注信息..." 
                  rows={3} 
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>操作</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={handleSubmit} 
                  disabled={items.filter(i => i.productName).length === 0 || loading}
                  className="w-full gap-2"
                >
                  {loading ? '保存中...' : '保存修改'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push(`/orders/${id}`)}>
                  取消
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">订单信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">订单号:</span>
                  <span className="font-mono font-medium">{order.orderNumber}</span>
                </div>
                {order.quoteNumber && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">来源报价:</span>
                    <span className="font-mono">{order.quoteNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">客户:</span>
                  <span>{order.customerName || '未知'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商机:</span>
                  <span>{order.opportunityName || '未知'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
