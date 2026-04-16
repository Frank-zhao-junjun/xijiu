'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import type { Order } from '@/lib/crm-types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface InvoiceItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    orderId: '',
    customerId: '',
    customerName: '',
    taxId: '',
    billingAddress: '',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
    status: 'draft' as 'draft' | 'issued',
  });
  
  const [items, setItems] = useState<InvoiceItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 },
  ]);

  // 金额计算
  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const taxRate = 0.06;
  const tax = (subtotal - totalDiscount) * taxRate;
  const total = subtotal - totalDiscount + tax;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        // 只显示已确认、待付款、已付款、已完成的订单
        const billableOrders = data
          .filter((o: Record<string, unknown>) => 
            ['confirmed', 'awaiting_payment', 'paid', 'completed'].includes(o.status as string)
          )
          .map((o: Record<string, unknown>) => ({
            id: o.id as string,
            orderNumber: o.order_number as string,
            customerId: o.customer_id as string,
            customerName: o.customer_name as string || '未知客户',
            status: o.status as string,
            total: Number(o.total),
            createdAt: o.created_at as string,
          }));
        setOrders(billableOrders);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setForm(prev => ({
        ...prev,
        orderId: order.id,
        customerId: (order as unknown as Record<string, unknown>).customer_id as string || (order as unknown as Record<string, unknown>).customerId as string || '',
        customerName: (order as unknown as Record<string, unknown>).customer_name as string || (order as unknown as Record<string, unknown>).customerName as string || '',
      }));
      // 从订单items带入
      // 这里简化处理，实际可以从API获取订单详情
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItemForm, value: string | number) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (['quantity', 'unitPrice', 'discount'].includes(field)) {
        const q = field === 'quantity' ? Number(value) : updated[index].quantity;
        const p = field === 'unitPrice' ? Number(value) : updated[index].unitPrice;
        const d = field === 'discount' ? Number(value) : updated[index].discount;
        updated[index].subtotal = (q * p) - d;
      }
      return updated;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (status: 'draft' | 'issued') => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            orderId: form.orderId || null,
            orderNumber: orders.find(o => o.id === form.orderId)?.orderNumber || null,
            customerId: form.customerId,
            customerName: form.customerName,
            taxId: form.taxId,
            billingAddress: form.billingAddress,
            status,
            issueDate: form.issueDate,
            dueDate: form.dueDate || null,
            subtotal,
            taxRate,
            tax,
            total,
            notes: form.notes,
            items: items.filter(i => i.productName).map(i => ({
              productName: i.productName,
              description: i.description,
              quantity: i.quantity,
              unitPrice: i.unitPrice,
              discount: i.discount,
              subtotal: i.subtotal,
            })),
          },
        }),
      });
      if (res.ok) {
        router.push('/invoices');
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/invoices">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">新建发票</h1>
          <p className="text-muted-foreground">创建销售发票</p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order">关联订单</Label>
              <Select value={form.orderId} onValueChange={handleOrderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="选择订单（可选）" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.orderNumber} - {order.customerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">选择订单可自动带入客户信息</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer">客户名称 *</Label>
              <Input
                id="customer"
                value={form.customerName}
                onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                placeholder="输入客户名称"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxId">购方税号</Label>
              <Input
                id="taxId"
                value={form.taxId}
                onChange={(e) => setForm(prev => ({ ...prev, taxId: e.target.value }))}
                placeholder="输入税号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issueDate">开票日期</Label>
              <Input
                id="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm(prev => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">到期日期</Label>
              <Input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm(prev => ({ ...prev, dueDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">开票地址</Label>
            <Textarea
              id="address"
              value={form.billingAddress}
              onChange={(e) => setForm(prev => ({ ...prev, billingAddress: e.target.value }))}
              placeholder="输入开票地址"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>发票明细</CardTitle>
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" />
            添加明细
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">产品/服务名称</TableHead>
                <TableHead className="w-[150px]">描述</TableHead>
                <TableHead className="w-[80px]">数量</TableHead>
                <TableHead className="w-[100px]">单价</TableHead>
                <TableHead className="w-[80px]">折扣</TableHead>
                <TableHead className="w-[100px]">小计</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={item.productName}
                      onChange={(e) => updateItem(index, 'productName', e.target.value)}
                      placeholder="产品名称"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="描述"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.discount}
                      onChange={(e) => updateItem(index, 'discount', e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    ¥{item.subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Amount Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-end space-y-2">
            <div className="flex justify-between w-64">
              <span className="text-muted-foreground">小计：</span>
              <span className="font-medium">¥{subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-muted-foreground">折扣：</span>
              <span className="font-medium text-destructive">-¥{totalDiscount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between w-64">
              <span className="text-muted-foreground">税额（{taxRate * 100}%）：</span>
              <span className="font-medium">¥{tax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between w-64 text-lg font-bold border-t pt-2">
              <span>合计：</span>
              <span className="text-primary">¥{total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="添加备注信息"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push('/invoices')}>
          取消
        </Button>
        <Button 
          variant="outline" 
          onClick={() => handleSubmit('draft')}
          disabled={submitting || !form.customerName}
        >
          <Save className="mr-2 h-4 w-4" />
          保存草稿
        </Button>
        <Button 
          onClick={() => handleSubmit('issued')}
          disabled={submitting || !form.customerName}
        >
          开票
        </Button>
      </div>
    </div>
  );
}


