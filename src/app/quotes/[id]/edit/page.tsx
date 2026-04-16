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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Plus, X, FileText, Building2, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { QUOTE_STATUS_CONFIG, type Quote, type QuoteStatus } from '@/lib/crm-types';
import { cn } from '@/lib/utils';

interface QuoteItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export default function EditQuotePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    validFrom: '',
    validUntil: '',
    terms: '',
    notes: '',
  });
  const [items, setItems] = useState<QuoteItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 },
  ]);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quotes?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: Quote = {
            id: data.id,
            opportunityId: data.opportunity_id,
            customerId: data.customer_id,
            customerName: data.customer_name,
            title: data.title,
            version: Number(data.version) || 1,
            revisionReason: data.revision_reason,
            status: data.status as QuoteStatus,
            validFrom: data.valid_from,
            validUntil: data.valid_until,
            subtotal: Number(data.subtotal),
            discount: Number(data.discount),
            tax: Number(data.tax),
            total: Number(data.total),
            terms: data.terms,
            notes: data.notes,
            items: (data.items || []).map((i: Record<string, unknown>) => ({
              id: i.id as string,
              quoteId: i.quote_id as string,
              productName: i.product_name as string,
              description: i.description as string | undefined,
              quantity: Number(i.quantity),
              unitPrice: Number(i.unit_price),
              discount: Number(i.discount),
              subtotal: Number(i.subtotal),
              sortOrder: i.sort_order as number,
            })),
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          };
          setQuote(mapped);
          setForm({
            title: mapped.title,
            validFrom: mapped.validFrom || '',
            validUntil: mapped.validUntil || '',
            terms: mapped.terms || '',
            notes: mapped.notes || '',
          });
          setItems(
            (mapped.items || []).length > 0
              ? mapped.items!.map(i => ({
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
    if (id) fetchQuote();
  }, [id]);

  const updateItem = (index: number, field: keyof QuoteItemForm, value: string | number) => {
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

  const subtotal = items.reduce((sum, i) => sum + i.subtotal, 0);
  const totalDiscount = items.reduce((sum, i) => sum + i.discount, 0);
  const taxRate = 0.06;
  const tax = (subtotal - totalDiscount) * taxRate;
  const total = subtotal - totalDiscount + tax;

  const handleSubmit = async () => {
    if (!form.title) return;
    setLoading(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          data: {
            title: form.title,
            validFrom: form.validFrom || null,
            validUntil: form.validUntil || null,
            subtotal,
            discount: totalDiscount,
            tax,
            total,
            terms: form.terms,
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
        router.push(`/quotes/${id}`);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  if (!quote) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  // Only draft quotes can be edited
  if (quote.status !== 'draft') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/quotes/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-bold">无法编辑</h2>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">只有草稿状态的报价单才能编辑</p>
            <p className="text-sm text-muted-foreground mt-2">
              当前状态: <Badge className={cn(QUOTE_STATUS_CONFIG[quote.status].className)}>{QUOTE_STATUS_CONFIG[quote.status].label}</Badge>
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push(`/quotes/${id}`)}>
              返回详情
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/quotes/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">编辑报价单</h2>
          <p className="text-muted-foreground text-sm">
            {quote.title} <Badge variant="outline" className="ml-1 text-xs">V{quote.version}</Badge>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> 基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>报价单标题 *</Label>
                <Input
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入报价单标题"
                />
              </div>

              {/* Read-only info */}
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 text-sm">
                {quote.customerName && (
                  <span className="text-muted-foreground">客户: <span className="text-foreground font-medium flex items-center gap-1 inline"><Building2 className="h-3.5 w-3.5" />{quote.customerName}</span></span>
                )}
                <span className="text-muted-foreground">商机: <Link href={`/opportunities/${quote.opportunityId}`} className="text-primary hover:underline flex items-center gap-1 inline"><Briefcase className="h-3.5 w-3.5" />查看商机</Link></span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>有效开始日期</Label>
                  <Input
                    type="date"
                    value={form.validFrom}
                    onChange={e => setForm(prev => ({ ...prev, validFrom: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>有效结束日期</Label>
                  <Input
                    type="date"
                    value={form.validUntil}
                    onChange={e => setForm(prev => ({ ...prev, validUntil: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>报价明细</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setItems(prev => [...prev, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }])}>
                  <Plus className="h-3 w-3" /> 添加行
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead className="w-[80px]">数量</TableHead>
                      <TableHead className="w-[120px]">单价</TableHead>
                      <TableHead className="w-[80px]">折扣</TableHead>
                      <TableHead className="w-[100px]">小计</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Input value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} placeholder="产品名称" className="h-8" /></TableCell>
                        <TableCell><Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="h-8" min={1} /></TableCell>
                        <TableCell><Input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} className="h-8" min={0} /></TableCell>
                        <TableCell><Input type="number" value={item.discount} onChange={e => updateItem(idx, 'discount', Number(e.target.value))} className="h-8" min={0} /></TableCell>
                        <TableCell className="font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                        <TableCell>
                          {items.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Notes */}
          <Card>
            <CardHeader><CardTitle>其他信息</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>条款说明</Label>
                <Textarea value={form.terms} onChange={e => setForm(prev => ({ ...prev, terms: e.target.value }))} placeholder="付款条款、交付方式等" rows={3} />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea value={form.notes} onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="备注信息" rows={2} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>金额汇总</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">小计</span><span>¥{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">折扣</span><span>-¥{totalDiscount.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">税额 (6%)</span><span>¥{tax.toFixed(2)}</span></div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg"><span>总计</span><span className="text-primary">¥{total.toFixed(2)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button className="w-full" onClick={handleSubmit} disabled={!form.title || loading}>
                  {loading ? '保存中...' : '保存修改'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push(`/quotes/${id}`)}>
                  取消
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
