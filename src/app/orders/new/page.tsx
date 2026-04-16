'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { ArrowLeft, Plus, X, Package, FileText, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface OrderItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

interface Opportunity {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  stage: string;
}

interface Quote {
  id: string;
  title: string;
  quoteNumber?: string;
  customerName?: string;
  opportunityId: string;
  opportunityName?: string;
  status: string;
  total: number;
}

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get('fromQuote');
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [form, setForm] = useState({
    quoteId: quoteId || '',
    opportunityId: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    paymentMethod: 'bank_transfer' as 'bank_transfer' | 'cash' | 'credit_card' | 'other',
    notes: '',
  });
  const [items, setItems] = useState<OrderItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch opportunities
        const oppRes = await fetch('/api/opportunities?status=active,negotiation,proposal');
        if (oppRes.ok) {
          const oppData = await oppRes.json();
          setOpportunities(oppData.filter((o: Opportunity) => o.stage !== 'closed_won' && o.stage !== 'closed_lost'));
        }

        // Fetch accepted quotes
        const quoteRes = await fetch('/api/quotes?status=accepted');
        if (quoteRes.ok) {
          const quoteData = await quoteRes.json();
          setQuotes(quoteData);
        }

        // If quoteId is provided, fetch quote details
        if (quoteId) {
          const res = await fetch(`/api/quotes?id=${quoteId}`);
          if (res.ok) {
            const quote = await res.json();
            setForm(prev => ({
              ...prev,
              quoteId: quoteId,
              opportunityId: quote.opportunity_id || '',
              customerName: quote.customer_name || '',
              notes: quote.notes || '',
            }));

            // Fetch quote items
            const itemsRes = await fetch(`/api/quotes/items?quoteId=${quoteId}`);
            if (itemsRes.ok) {
              const itemsData = await itemsRes.json();
              if (itemsData.length > 0) {
                setItems(itemsData.map((item: { product_name: string; description: string | null; quantity: number; unit_price: string; discount: string; subtotal: string }) => ({
                  productName: item.product_name,
                  description: item.description || '',
                  quantity: item.quantity,
                  unitPrice: parseFloat(item.unit_price),
                  discount: parseFloat(item.discount),
                  subtotal: parseFloat(item.subtotal),
                })));
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [quoteId]);

  const handleOpportunityChange = async (oppId: string) => {
    setForm(prev => ({ ...prev, opportunityId: oppId, quoteId: '' }));
    if (oppId) {
      const opp = opportunities.find(o => o.id === oppId);
      if (opp) {
        setForm(prev => ({ ...prev, customerName: opp.customerName }));
      }
    }
  };

  const handleQuoteChange = async (qId: string) => {
    setForm(prev => ({ ...prev, quoteId: qId }));
    if (qId) {
      const res = await fetch(`/api/quotes?id=${qId}`);
      if (res.ok) {
        const quote = await res.json();
        setForm(prev => ({
          ...prev,
          opportunityId: quote.opportunity_id || prev.opportunityId,
          customerName: quote.customer_name || prev.customerName,
          notes: quote.notes || prev.notes,
        }));

        // Fetch quote items
        const itemsRes = await fetch(`/api/quotes/items?quoteId=${qId}`);
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          if (itemsData.length > 0) {
            setItems(itemsData.map((item: { product_name: string; description: string | null; quantity: number; unit_price: string; discount: string; subtotal: string }) => ({
              productName: item.product_name,
              description: item.description || '',
              quantity: item.quantity,
              unitPrice: parseFloat(item.unit_price),
              discount: parseFloat(item.discount),
              subtotal: parseFloat(item.subtotal),
            })));
          }
        }
      }
    }
  };

  const addItem = () => {
    setItems([...items, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof OrderItemForm, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate subtotal
    if (['quantity', 'unitPrice', 'discount'].includes(field)) {
      const qty = field === 'quantity' ? Number(value) : newItems[index].quantity;
      const price = field === 'unitPrice' ? Number(value) : newItems[index].unitPrice;
      const disc = field === 'discount' ? Number(value) : newItems[index].discount;
      newItems[index].subtotal = qty * price * (1 - disc / 100);
    }
    
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.discount / 100), 0);
  const tax = subtotal * 0.06;
  const total = subtotal + tax;

  const handleSubmit = async () => {
    if (!form.opportunityId || items.filter(i => i.productName).length === 0) {
      alert('请填写必填信息');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            ...form,
            subtotal,
            discount: totalDiscount,
            tax,
            total,
            items: items.filter(i => i.productName),
          },
        }),
      });

      if (res.ok) {
        router.push('/orders');
      } else {
        const error = await res.json();
        alert('创建失败: ' + error.error);
      }
    } catch {
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto py-4 px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/orders" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>返回</span>
            </Link>
            <h1 className="text-2xl font-bold">新建订单</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>关联商机</Label>
                    <Select value={form.opportunityId} onValueChange={handleOpportunityChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择商机" />
                      </SelectTrigger>
                      <SelectContent>
                        {opportunities.map(opp => (
                          <SelectItem key={opp.id} value={opp.id}>
                            <div className="flex items-center gap-2">
                              <Briefcase className="h-4 w-4" />
                              <span>{opp.title}</span>
                              <span className="text-muted-foreground">({opp.customerName})</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>关联报价单</Label>
                    <Select value={form.quoteId} onValueChange={handleQuoteChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择报价单（可选）" />
                      </SelectTrigger>
                      <SelectContent>
                        {quotes
                          .filter(q => !form.opportunityId || q.opportunityId === form.opportunityId)
                          .map(quote => (
                            <SelectItem key={quote.id} value={quote.id}>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                <span>{quote.title || quote.quoteNumber}</span>
                                <span className="text-muted-foreground">¥{quote.total.toLocaleString()}</span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>客户名称</Label>
                    <Input 
                      value={form.customerName} 
                      onChange={e => setForm(prev => ({ ...prev, customerName: e.target.value }))}
                      placeholder="客户名称"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>订单日期</Label>
                    <Input 
                      type="date"
                      value={form.orderDate} 
                      onChange={e => setForm(prev => ({ ...prev, orderDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>交付日期</Label>
                    <Input 
                      type="date"
                      value={form.deliveryDate} 
                      onChange={e => setForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>付款方式</Label>
                    <Select
                      value={form.paymentMethod}
                      onValueChange={(v) =>
                        setForm((prev) => ({
                          ...prev,
                          paymentMethod: v as typeof prev.paymentMethod,
                        }))
                      }
                    >
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
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    订单产品
                  </CardTitle>
                  <Button size="sm" onClick={addItem} className="gap-2">
                    <Plus className="h-4 w-4" />
                    添加产品
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead className="w-24">数量</TableHead>
                      <TableHead className="w-32">单价</TableHead>
                      <TableHead className="w-24">折扣(%)</TableHead>
                      <TableHead className="w-32">小计</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input 
                            value={item.productName}
                            onChange={e => updateItem(index, 'productName', e.target.value)}
                            placeholder="产品名称"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={item.description}
                            onChange={e => updateItem(index, 'description', e.target.value)}
                            placeholder="描述"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={e => updateItem(index, 'quantity', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unitPrice}
                            onChange={e => updateItem(index, 'unitPrice', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            type="number"
                            min={0}
                            max={100}
                            value={item.discount}
                            onChange={e => updateItem(index, 'discount', e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          ¥{item.subtotal.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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
                  disabled={!form.opportunityId || items.filter(i => i.productName).length === 0 || loading}
                  className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                >
                  {loading ? '创建中...' : '创建订单'}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => router.push('/orders')}>
                  取消
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">订单状态流程</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="text-muted-foreground">草稿</span>
                  </div>
                  <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-muted-foreground">已确认</span>
                  </div>
                  <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">待付款</span>
                  </div>
                  <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">已付款</span>
                  </div>
                  <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4" />
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-600" />
                    <span className="text-muted-foreground">已完成</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewOrderContent />
    </Suspense>
  );
}
