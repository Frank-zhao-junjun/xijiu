'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Plus, X, FileText } from 'lucide-react';
import Link from 'next/link';

interface Opportunity {
  id: string;
  title: string;
  customerName: string;
  customerId: string;
  stage: string;
}

interface QuoteItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export default function NewQuotePage() {
  const router = useRouter();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    opportunityId: '',
    title: '',
    revisionReason: '',
    validFrom: '',
    validUntil: '',
    terms: '',
    notes: '',
  });
  const [items, setItems] = useState<QuoteItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 },
  ]);

  useEffect(() => {
    // Fetch active opportunities for selection
    const fetchOpportunities = async () => {
      try {
        const res = await fetch('/api/crm?type=opportunities');
        if (res.ok) {
          const data = await res.json();
          // Only show non-terminal opportunities
          const active = data.filter((o: Record<string, unknown>) =>
            !['closed_won', 'closed_lost'].includes(o.stage as string)
          );
          setOpportunities(active.map((o: Record<string, unknown>) => ({
            id: o.id as string,
            title: o.title as string,
            customerName: o.customer_name as string,
            customerId: o.customer_id as string,
            stage: o.stage as string,
          })));
        }
      } catch { /* silent */ }
    };
    fetchOpportunities();
  }, []);

  const selectedOpp = opportunities.find(o => o.id === form.opportunityId);

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
    if (!form.opportunityId || !form.title) return;
    setLoading(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            opportunityId: form.opportunityId,
            title: form.title,
            revisionReason: form.revisionReason || null,
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
        const data = await res.json();
        router.push(`/quotes/${data.id}`);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/quotes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">新建报价单</h2>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>关联商机 *</Label>
                  <Select value={form.opportunityId} onValueChange={v => {
                    const opp = opportunities.find(o => o.id === v);
                    setForm(prev => ({
                      ...prev,
                      opportunityId: v,
                      title: prev.title || (opp ? `${opp.title} - 报价单` : ''),
                    }));
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择商机" />
                    </SelectTrigger>
                    <SelectContent>
                      {opportunities.map(opp => (
                        <SelectItem key={opp.id} value={opp.id}>
                          {opp.title} ({opp.customerName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>报价单标题 *</Label>
                  <Input
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="输入报价单标题"
                  />
                </div>
              </div>

              {selectedOpp && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="text-muted-foreground">客户: <span className="text-foreground font-medium">{selectedOpp.customerName}</span></span>
                  <span className="text-muted-foreground">商机: <span className="text-foreground font-medium">{selectedOpp.title}</span></span>
                </div>
              )}

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

              <div className="space-y-2">
                <Label>修订原因</Label>
                <Textarea
                  value={form.revisionReason}
                  onChange={e => setForm(prev => ({ ...prev, revisionReason: e.target.value }))}
                  placeholder="说明本次报价的修订原因（可选）"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>报价明细</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={addItem}>
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
            </CardContent>
          </Card>

          {/* Terms & Notes */}
          <Card>
            <CardHeader>
              <CardTitle>其他信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>条款说明</Label>
                <Textarea
                  value={form.terms}
                  onChange={e => setForm(prev => ({ ...prev, terms: e.target.value }))}
                  placeholder="付款条款、交付方式等"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="备注信息"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>金额汇总</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">小计</span>
                <span>¥{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">折扣</span>
                <span>-¥{totalDiscount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">税额 (6%)</span>
                <span>¥{tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>总计</span>
                <span className="text-primary">¥{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={!form.opportunityId || !form.title || loading}
                >
                  {loading ? '创建中...' : '保存为草稿'}
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/quotes">取消</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
