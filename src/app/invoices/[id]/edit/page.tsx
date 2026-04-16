'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import type { Invoice } from '@/lib/crm-types';

interface InvoiceItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    customerName: '',
    taxId: '',
    billingAddress: '',
    issueDate: '',
    dueDate: '',
    notes: '',
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

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?id=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        const inv: Invoice = {
          id: data.id,
          invoiceNumber: data.invoice_number,
          orderId: data.order_id,
          orderNumber: data.order_number,
          customerId: data.customer_id,
          customerName: data.customer_name,
          taxId: data.tax_id,
          billingAddress: data.billing_address,
          status: data.status,
          issueDate: data.issue_date,
          dueDate: data.due_date,
          subtotal: Number(data.subtotal),
          taxRate: Number(data.tax_rate) || 0.06,
          tax: Number(data.tax),
          total: Number(data.total),
          paidDate: data.paid_date,
          paymentMethod: data.payment_method,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        
        if (inv.status !== 'draft') {
          router.push(`/invoices/${params.id}`);
          return;
        }
        
        setInvoice(inv);
        setForm({
          customerName: inv.customerName,
          taxId: inv.taxId || '',
          billingAddress: inv.billingAddress || '',
          issueDate: inv.issueDate,
          dueDate: inv.dueDate || '',
          notes: inv.notes || '',
        });
        
        // 如果有items数据
        if (data.items && data.items.length > 0) {
          setItems(data.items.map((i: Record<string, unknown>) => ({
            productName: i.productName as string,
            description: (i.description as string) || '',
            quantity: Number(i.quantity),
            unitPrice: Number(i.unitPrice),
            discount: Number(i.discount),
            subtotal: Number(i.subtotal),
          })));
        }
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [params.id, router]);

  useEffect(() => {
    void fetchInvoice();
  }, [fetchInvoice]);

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

  const handleSubmit = async () => {
    if (!invoice) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          data: {
            id: invoice.id,
            customerName: form.customerName,
            taxId: form.taxId,
            billingAddress: form.billingAddress,
            issueDate: form.issueDate,
            dueDate: form.dueDate || null,
            subtotal,
            taxRate,
            tax,
            total,
            notes: form.notes,
          },
        }),
      });
      if (res.ok) {
        router.push(`/invoices/${invoice.id}`);
      }
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center">
        <p className="text-muted-foreground">发票不存在</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/invoices/${params.id}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">编辑发票</h1>
          <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
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
              <Label htmlFor="customer">客户名称 *</Label>
              <Input
                id="customer"
                value={form.customerName}
                onChange={(e) => setForm(prev => ({ ...prev, customerName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">购方税号</Label>
              <Input
                id="taxId"
                value={form.taxId}
                onChange={(e) => setForm(prev => ({ ...prev, taxId: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="issueDate">开票日期</Label>
              <Input
                id="issueDate"
                type="date"
                value={form.issueDate}
                onChange={(e) => setForm(prev => ({ ...prev, issueDate: e.target.value }))}
              />
            </div>
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
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
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
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push(`/invoices/${params.id}`)}>
          取消
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={submitting || !form.customerName}
        >
          <Save className="mr-2 h-4 w-4" />
          保存更改
        </Button>
      </div>
    </div>
  );
}
