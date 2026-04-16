'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Edit, Trash2, DollarSign, Building2, Calendar, User, FileText, Plus, Send, ArrowRight, X, Activity } from 'lucide-react';
import Link from 'next/link';
import { OpportunityStage, QUOTE_STATUS_CONFIG, type Quote, type QuoteStatus } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { FollowUpTimeline } from '@/components/crm/follow-up-timeline';
import { SendEmailDialog } from '@/components/email/send-email-dialog';

const stageLabels: Record<OpportunityStage, { label: string; className: string; description: string }> = {
  qualified: { label: '商机确认', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', description: '商机已确认，待深入沟通' },
  discovery: { label: '需求调研', className: 'bg-sky-500/10 text-sky-500 border-sky-500/20', description: '了解客户需求，进行调研交流' },
  proposal: { label: '方案报价', className: 'bg-purple-500/10 text-purple-500 border-purple-500/20', description: '已提交方案和报价' },
  negotiation: { label: '商务洽谈', className: 'bg-orange-500/10 text-orange-500 border-orange-500/20', description: '正在商务谈判' },
  contract: { label: '合同签署', className: 'bg-teal-500/10 text-teal-500 border-teal-500/20', description: '合同签署中' },
  closed_won: { label: '成交', className: 'bg-green-500/10 text-green-500 border-green-500/20', description: '已成交' },
  closed_lost: { label: '失败', className: 'bg-red-500/10 text-red-500 border-red-500/20', description: '已失败' },
};

interface QuoteItemForm {
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { opportunities, deleteOpportunity } = useCRM();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  // Quotes state
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [showCreateQuote, setShowCreateQuote] = useState(false);
  const [createQuoteForm, setCreateQuoteForm] = useState({
    title: '',
    validFrom: '',
    validUntil: '',
    terms: '',
    notes: '',
    revisionReason: '',
  });
  const [createQuoteItems, setCreateQuoteItems] = useState<QuoteItemForm[]>([
    { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 },
  ]);
  const [deleteQuoteId, setDeleteQuoteId] = useState<string | null>(null);

  // Follow-up stats
  const [followUpStats, setFollowUpStats] = useState<{ total: number; meetings: number; calls: number; lastFollowUp: string | null }>({
    total: 0, meetings: 0, calls: 0, lastFollowUp: null,
  });

  const opportunity = opportunities.find(o => o.id === params.id);

  const fetchQuotes = useCallback(async () => {
    if (!params.id) return;
    setQuotesLoading(true);
    try {
      const res = await fetch(`/api/quotes?opportunityId=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.map((q: Record<string, unknown>) => ({
          id: q.id as string,
          opportunityId: q.opportunity_id as string,
          customerId: q.customer_id as string | undefined,
          customerName: q.customer_name as string | undefined,
          title: q.title as string,
          version: Number(q.version) || 1,
          revisionReason: q.revision_reason as string | undefined,
          status: q.status as QuoteStatus,
          validFrom: q.valid_from as string | undefined,
          validUntil: q.valid_until as string | undefined,
          subtotal: Number(q.subtotal),
          discount: Number(q.discount),
          tax: Number(q.tax),
          total: Number(q.total),
          terms: q.terms as string | undefined,
          notes: q.notes as string | undefined,
          items: ((q.items || []) as Record<string, unknown>[]).map((i) => ({
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
          createdAt: q.created_at as string,
          updatedAt: q.updated_at as string,
        })));
      }
    } catch { /* silent */ }
    finally { setQuotesLoading(false); }
  }, [params.id]);

  const fetchFollowUpStats = useCallback(async () => {
    if (!params.id) return;
    try {
      const res = await fetch(`/api/follow-ups?entityType=opportunity&entityId=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.items || []);
        const total = items.length;
        const meetings = items.filter((f: Record<string, unknown>) => f.method === 'meeting').length;
        const calls = items.filter((f: Record<string, unknown>) => f.method === 'phone').length;
        const lastItem = items.sort((a: Record<string, unknown>, b: Record<string, unknown>) =>
          new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
        )[0] as Record<string, unknown> | undefined;
        setFollowUpStats({
          total,
          meetings,
          calls,
          lastFollowUp: lastItem ? (lastItem.created_at as string) : null,
        });
      }
    } catch { /* silent */ }
  }, [params.id]);

  useEffect(() => { fetchQuotes(); fetchFollowUpStats(); }, [fetchQuotes, fetchFollowUpStats]);

  if (!opportunity) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">商机不存在</p>
      </div>
    );
  }

  const handleDelete = () => {
    deleteOpportunity(opportunity.id);
    router.push('/opportunities');
  };

  // Quote creation
  const updateItem = (index: number, field: keyof QuoteItemForm, value: string | number) => {
    setCreateQuoteItems(prev => {
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

  const handleCreateQuote = async () => {
    const subtotal = createQuoteItems.reduce((sum, i) => sum + i.subtotal, 0);
    const discount = createQuoteItems.reduce((sum, i) => sum + i.discount, 0);
    const taxRate = 0.06;
    const tax = (subtotal - discount) * taxRate;
    const total = subtotal - discount + tax;

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          data: {
            opportunityId: opportunity.id,
            title: createQuoteForm.title,
            revisionReason: createQuoteForm.revisionReason || null,
            validFrom: createQuoteForm.validFrom || null,
            validUntil: createQuoteForm.validUntil || null,
            subtotal,
            discount,
            tax,
            total,
            terms: createQuoteForm.terms,
            notes: createQuoteForm.notes,
            items: createQuoteItems.filter(i => i.productName).map(i => ({
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
        setShowCreateQuote(false);
        setCreateQuoteForm({ title: '', validFrom: '', validUntil: '', terms: '', notes: '', revisionReason: '' });
        setCreateQuoteItems([{ productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }]);
        fetchQuotes();
      }
    } catch { /* silent */ }
  };

  const handleQuoteAction = async (action: string, quoteId: string) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id: quoteId }),
      });
      if (res.ok) {
        fetchQuotes();
      }
    } catch { /* silent */ }
  };

  const handleDeleteQuote = async () => {
    if (!deleteQuoteId) return;
    try {
      await fetch(`/api/quotes?id=${deleteQuoteId}`, { method: 'DELETE' });
      setDeleteQuoteId(null);
      fetchQuotes();
    } catch { /* silent */ }
  };

  return (
    <div className="space-y-6">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/opportunities">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{opportunity.title}</h2>
            <p className="text-muted-foreground">{opportunity.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateQuote(true)} className="gap-2">
            <FileText className="h-4 w-4" />
            {quotes.length > 0 ? '新建报价版本' : '新建报价单'}
          </Button>
          <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            发送邮件
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/opportunities/${opportunity.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Link>
          </Button>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            删除
          </Button>
        </div>
      </div>

      {/* ====== 机会详情 ====== */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 机会详情 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>机会详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">机会名称</p>
                <p className="font-medium">{opportunity.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">当前阶段</p>
                <Badge variant="outline" className={cn(stageLabels[opportunity.stage].className)}>
                  {stageLabels[opportunity.stage].label}
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">金额</p>
                  <p className="font-medium">¥{opportunity.value.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">预计成交</p>
                  <p className="font-medium">
                    {opportunity.expectedCloseDate
                      ? format(new Date(opportunity.expectedCloseDate), 'yyyy/MM/dd', { locale: zhCN })
                      : '-'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">成交概率</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${opportunity.probability}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{opportunity.probability}%</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">客户</p>
                <Link
                  href={`/customers/${opportunity.customerId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {opportunity.customerName}
                </Link>
              </div>
            </div>

            {opportunity.contactName && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">联系人</p>
                  <p className="text-sm">{opportunity.contactName}</p>
                </div>
              </div>
            )}

            {opportunity.description && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">描述</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{opportunity.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 销售漏斗进度 */}
        <Card>
          <CardHeader>
            <CardTitle>销售漏斗</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['qualified', 'discovery', 'proposal', 'negotiation', 'contract', 'closed_won'].map((stage, index) => {
              const stageData = stageLabels[stage as OpportunityStage];
              const isActive = opportunity.stage === stage;
              const isPast = ['qualified', 'discovery', 'proposal', 'negotiation', 'contract', 'closed_won'].indexOf(opportunity.stage) > index;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium",
                    isActive ? "bg-primary text-primary-foreground" : isPast ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400" : "bg-muted"
                  )}>
                    {isPast ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary",
                      isPast && "text-green-600 dark:text-green-400"
                    )}>
                      {stageData.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-muted-foreground">{stageData.description}</p>
                    )}
                  </div>
                  {isActive && (
                    <Badge variant="secondary">当前</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* 进度摘要 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            进度摘要
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-500/10">
                <FileText className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quotes.length}</p>
                <p className="text-xs text-muted-foreground">报价次数</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/10">
                <DollarSign className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{followUpStats.calls}</p>
                <p className="text-xs text-muted-foreground">电话沟通</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/5 border border-green-500/10">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-green-500/10">
                <User className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{followUpStats.meetings}</p>
                <p className="text-xs text-muted-foreground">面谈拜访</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-500/10">
                <Calendar className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {followUpStats.lastFollowUp
                    ? format(new Date(followUpStats.lastFollowUp), 'MM/dd', { locale: zhCN })
                    : '-'}
                </p>
                <p className="text-xs text-muted-foreground">最近跟进</p>
              </div>
            </div>
          </div>
          {followUpStats.total > 0 && (
            <div className="mt-3 text-xs text-muted-foreground">
              累计跟进 <span className="font-medium text-foreground">{followUpStats.total}</span> 次
            </div>
          )}
        </CardContent>
      </Card>

      {/* 元信息 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>创建时间: {format(new Date(opportunity.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
            <span>更新时间: {format(new Date(opportunity.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
          </div>
        </CardContent>
      </Card>

      {/* 活动追踪 */}
      <ActivityTimeline 
        entityId={opportunity.id}
        entityType="opportunity"
        showFilters={false}
        title={`关于 "${opportunity.title}" 的活动`}
      />

      {/* ====== 报价单列表 ====== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">关联报价单</h3>
            {quotes.length > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">{quotes.length}</Badge>
            )}
          </div>
          <Button onClick={() => setShowCreateQuote(true)} className="gap-2">
            <Plus className="h-4 w-4" /> {quotes.length > 0 ? '新建报价版本' : '新建报价单'}
          </Button>
        </div>

        {quotesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : quotes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-purple-500/10 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">暂无关联报价单</p>
              <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowCreateQuote(true)}>
                <Plus className="h-4 w-4" /> 新建报价单
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => {
              const statusConf = QUOTE_STATUS_CONFIG[quote.status];
              return (
                <Card key={quote.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    {/* Quote header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/quotes/${quote.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{quote.title}</p>
                            <Badge variant="outline" className={cn(
                              "text-xs px-1.5 py-0",
                              quote.version > 1
                                ? "bg-purple-50 text-purple-600 border-purple-200"
                                : "bg-gray-50 text-gray-500 border-gray-200"
                            )}>
                              V{quote.version}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>创建于 {format(new Date(quote.createdAt), 'yyyy-MM-dd')}</span>
                            {quote.revisionReason && (
                              <>
                                <span className="text-muted-foreground/40">|</span>
                                <span className="text-purple-500">修订原因: {quote.revisionReason}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-primary">¥{quote.total.toLocaleString()}</span>
                        <Badge className={statusConf.className}>{statusConf.label}</Badge>
                        <div className="flex gap-1">
                          {quote.status === 'draft' && (
                            <Button size="sm" variant="outline" className="gap-1 h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleQuoteAction('send', quote.id); }}>
                              <Send className="h-3 w-3" /> 发送
                            </Button>
                          )}
                          {quote.status === 'active' && (
                            <>
                              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs text-green-600" onClick={(e) => { e.stopPropagation(); handleQuoteAction('accept', quote.id); }}>
                                接受
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs text-red-600" onClick={(e) => { e.stopPropagation(); handleQuoteAction('reject', quote.id); }}>
                                拒绝
                              </Button>
                            </>
                          )}
                          {quote.status === 'accepted' && (
                            <Button size="sm" className="gap-1 h-7 text-xs bg-green-600 hover:bg-green-700" onClick={(e) => { e.stopPropagation(); handleQuoteAction('convertToOrder', quote.id); }}>
                              <ArrowRight className="h-3 w-3" /> 转订单
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={(e) => { e.stopPropagation(); setDeleteQuoteId(quote.id); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Quote items preview */}
                    {quote.items && quote.items.length > 0 && (
                      <div className="border-t">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>产品名称</TableHead>
                              <TableHead className="text-right w-[80px]">数量</TableHead>
                              <TableHead className="text-right w-[120px]">单价</TableHead>
                              <TableHead className="text-right w-[100px]">小计</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quote.items.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  <div>
                                    <p className="text-sm">{item.productName}</p>
                                    {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                                <TableCell className="text-right text-sm">¥{item.unitPrice.toLocaleString()}</TableCell>
                                <TableCell className="text-right text-sm font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="flex justify-end p-3 border-t bg-muted/30 text-sm space-x-6">
                          <span>小计: ¥{quote.subtotal.toLocaleString()}</span>
                          <span>折扣: -¥{quote.discount.toLocaleString()}</span>
                          <span>税额: ¥{quote.tax.toLocaleString()}</span>
                          <span className="font-bold text-primary">总计: ¥{quote.total.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ====== 跟进记录 ====== */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">跟进记录</h3>
        <FollowUpTimeline
          entityType="opportunity"
          entityId={opportunity.id}
          entityName={opportunity.title}
        />
      </div>

      {/* Delete Opportunity Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除商机 &ldquo;{opportunity.title}&rdquo; 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Quote Dialog */}
      <Dialog open={showCreateQuote} onOpenChange={setShowCreateQuote}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {quotes.length > 0 ? '新建报价版本' : '新建报价单'}
            </DialogTitle>
            <DialogDescription>
              {quotes.length > 0
                ? `为商机「${opportunity.title}」创建新版报价单（当前最新版本: V${Math.max(...quotes.map(q => q.version))}）`
                : `为商机「${opportunity.title}」创建报价单`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Revision reason - only show when there are existing quotes */}
            {quotes.length > 0 && (
              <div className="space-y-2 border-l-4 border-purple-400 pl-4 py-1 bg-purple-50/50 rounded-r-md">
                <Label className="text-purple-700">版本修订原因 *</Label>
                <Textarea
                  value={createQuoteForm.revisionReason}
                  onChange={e => setCreateQuoteForm(prev => ({ ...prev, revisionReason: e.target.value }))}
                  placeholder="请说明为什么要新建一版报价，例如：客户要求调整价格、产品配置变更..."
                  rows={2}
                />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>关联机会</Label>
                <Input value={opportunity.title} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>报价单标题 *</Label>
                <Input
                  value={createQuoteForm.title}
                  onChange={e => setCreateQuoteForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="输入报价单标题"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>有效开始日期</Label>
                <Input
                  type="date"
                  value={createQuoteForm.validFrom}
                  onChange={e => setCreateQuoteForm(prev => ({ ...prev, validFrom: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>有效结束日期</Label>
                <Input
                  type="date"
                  value={createQuoteForm.validUntil}
                  onChange={e => setCreateQuoteForm(prev => ({ ...prev, validUntil: e.target.value }))}
                />
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>报价明细</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => setCreateQuoteItems(prev => [...prev, { productName: '', description: '', quantity: 1, unitPrice: 0, discount: 0, subtotal: 0 }])}
                >
                  <Plus className="h-3 w-3" /> 添加
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>产品名称</TableHead>
                      <TableHead className="w-[80px]">数量</TableHead>
                      <TableHead className="w-[120px]">单价</TableHead>
                      <TableHead className="w-[80px]">折扣</TableHead>
                      <TableHead className="w-[100px]">小计</TableHead>
                      <TableHead className="w-[40px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createQuoteItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell><Input value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} placeholder="产品名称" className="h-8" /></TableCell>
                        <TableCell><Input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="h-8" min={1} /></TableCell>
                        <TableCell><Input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', Number(e.target.value))} className="h-8" min={0} /></TableCell>
                        <TableCell><Input type="number" value={item.discount} onChange={e => updateItem(idx, 'discount', Number(e.target.value))} className="h-8" min={0} /></TableCell>
                        <TableCell className="font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                        <TableCell>
                          {createQuoteItems.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCreateQuoteItems(prev => prev.filter((_, i) => i !== idx))}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="text-right text-sm space-y-1">
                <p>小计: ¥{createQuoteItems.reduce((s, i) => s + i.subtotal, 0).toLocaleString()}</p>
                <p>折扣: -¥{createQuoteItems.reduce((s, i) => s + i.discount, 0).toLocaleString()}</p>
                <p>税额(6%): ¥{((createQuoteItems.reduce((s, i) => s + i.subtotal, 0) - createQuoteItems.reduce((s, i) => s + i.discount, 0)) * 0.06).toFixed(2)}</p>
                <p className="text-lg font-bold">总计: ¥{((createQuoteItems.reduce((s, i) => s + i.subtotal, 0) - createQuoteItems.reduce((s, i) => s + i.discount, 0)) * 1.06).toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>条款说明</Label>
              <Textarea value={createQuoteForm.terms} onChange={e => setCreateQuoteForm(prev => ({ ...prev, terms: e.target.value }))} placeholder="付款条款、交付方式等" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea value={createQuoteForm.notes} onChange={e => setCreateQuoteForm(prev => ({ ...prev, notes: e.target.value }))} placeholder="备注信息" rows={2} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateQuote(false)}>取消</Button>
            <Button onClick={handleCreateQuote} disabled={!createQuoteForm.title || (quotes.length > 0 && !createQuoteForm.revisionReason)} className="bg-gradient-to-r from-primary to-purple-600">
              {quotes.length > 0 ? `创建 V${Math.max(...quotes.map(q => q.version)) + 1} 版本` : '保存草稿'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Quote Dialog */}
      <Dialog open={!!deleteQuoteId} onOpenChange={() => setDeleteQuoteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> 确认删除
            </DialogTitle>
            <DialogDescription>确定要删除这个报价单吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteQuoteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteQuote}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        entityType="opportunity"
        entityId={opportunity.id}
        entityName={opportunity.title}
        toEmail={opportunity.contactName ? '' : ''}
      />
    </div>
  );
}
