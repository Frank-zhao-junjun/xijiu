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
import { ArrowLeft, Send, ArrowRight, FileText, Briefcase, GitBranch, MessageSquare, Building2, Edit, Trash2, Calendar } from 'lucide-react';
import Link from 'next/link';
import { QUOTE_STATUS_CONFIG, type Quote, type QuoteStatus } from '@/lib/crm-types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function QuoteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [quote, setQuote] = useState<Quote | null>(null);
  const [allQuotesForOpp, setAllQuotesForOpp] = useState<Quote[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quotes?id=${id}`);
        if (res.ok) {
          const data = await res.json();
          const mappedQuote: Quote = {
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
          setQuote(mappedQuote);

          // Fetch all quotes for the same opportunity to show version history
          if (data.opportunity_id) {
            const oppRes = await fetch(`/api/quotes?opportunityId=${data.opportunity_id}`);
            if (oppRes.ok) {
              const oppData = await oppRes.json();
              setAllQuotesForOpp(oppData.map((q: Record<string, unknown>) => ({
                id: q.id,
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
                createdAt: q.created_at as string,
                updatedAt: q.updated_at as string,
              })).sort((a: Quote, b: Quote) => b.version - a.version));
            }
          }
        }
      } catch { /* silent */ }
    };
    if (id) fetchQuote();
  }, [id]);

  const handleAction = async (action: string) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      if (res.ok) {
        if (action === 'convertToOrder') {
          router.push('/orders');
        } else {
          // Refresh
          const data = await res.json();
          setQuote(prev => prev ? { ...prev, status: data.status } : prev);
        }
      }
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/quotes?id=${id}`, { method: 'DELETE' });
      router.push('/quotes');
    } catch { /* silent */ }
  };

  if (!quote) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  const statusConf = QUOTE_STATUS_CONFIG[quote.status];
  const isEditable = quote.status === 'draft';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{quote.title}</h1>
              <Badge variant="outline" className={quote.version > 1 ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-gray-50 text-gray-500 border-gray-200"}>
                V{quote.version}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">创建于 {format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={statusConf.className}>{statusConf.label}</Badge>
          {isEditable && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/quotes/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" /> 编辑
                </Link>
              </Button>
              <Button onClick={() => handleAction('send')} className="gap-2">
                <Send className="h-4 w-4" /> 发送报价
              </Button>
            </>
          )}
          {quote.status === 'active' && (
            <>
              <Button onClick={() => handleAction('accept')} className="gap-2 bg-green-600 hover:bg-green-700">接受</Button>
              <Button variant="destructive" onClick={() => handleAction('reject')}>拒绝</Button>
            </>
          )}
          {quote.status === 'accepted' && (
            <Button onClick={() => handleAction('convertToOrder')} className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600">
              <ArrowRight className="h-4 w-4" /> 转为订单
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quote Items */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> 报价明细</CardTitle></CardHeader>
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
                  {(quote.items || []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">¥{item.unitPrice.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.discount > 0 ? `-¥${item.discount.toLocaleString()}` : '-'}</TableCell>
                      <TableCell className="text-right font-medium">¥{item.subtotal.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Summary row */}
              <div className="flex justify-end p-4 border-t bg-muted/30 text-sm space-x-6">
                <span>小计: ¥{quote.subtotal.toLocaleString()}</span>
                <span>折扣: -¥{quote.discount.toLocaleString()}</span>
                <span>税额: ¥{quote.tax.toLocaleString()}</span>
                <span className="font-bold text-primary">总计: ¥{quote.total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Terms */}
          {quote.terms && (
            <Card>
              <CardHeader><CardTitle>条款说明</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{quote.terms}</p></CardContent>
            </Card>
          )}

          {quote.notes && (
            <Card>
              <CardHeader><CardTitle>备注</CardTitle></CardHeader>
              <CardContent><p className="text-sm whitespace-pre-wrap">{quote.notes}</p></CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader><CardTitle>金额汇总</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">小计</span><span>¥{quote.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">折扣</span><span>-¥{quote.discount.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">税额</span><span>¥{quote.tax.toLocaleString()}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>总计</span><span className="text-primary">¥{quote.total.toLocaleString()}</span></div>
            </CardContent>
          </Card>

          {/* Details */}
          <Card>
            <CardHeader><CardTitle>详细信息</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="text-muted-foreground">状态</span>
                <div className="mt-1"><Badge className={statusConf.className}>{statusConf.label}</Badge></div>
              </div>
              <div>
                <span className="text-muted-foreground">版本</span>
                <div className="mt-1">
                  <Badge variant="outline" className={quote.version > 1 ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-gray-50 text-gray-500 border-gray-200"}>
                    V{quote.version}
                  </Badge>
                </div>
              </div>
              {quote.customerName && (
                <div>
                  <span className="text-muted-foreground">客户</span>
                  <div className="mt-1">
                    <Link href={`/customers/${quote.customerId}`} className="text-primary hover:underline flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> {quote.customerName}
                    </Link>
                  </div>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">关联商机</span>
                <div className="mt-1">
                  <Link href={`/opportunities/${quote.opportunityId}`} className="text-primary hover:underline flex items-center gap-1">
                    <Briefcase className="h-3.5 w-3.5" /> 查看商机
                  </Link>
                </div>
              </div>
              {quote.validFrom && (
                <div>
                  <span className="text-muted-foreground">有效期开始</span>
                  <div className="mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(quote.validFrom), 'yyyy-MM-dd')}
                  </div>
                </div>
              )}
              {quote.validUntil && (
                <div>
                  <span className="text-muted-foreground">有效期结束</span>
                  <div className="mt-1 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {format(new Date(quote.validUntil), 'yyyy-MM-dd')}
                  </div>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>创建: {format(new Date(quote.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>更新: {format(new Date(quote.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
              </div>
            </CardContent>
          </Card>

          {/* Revision Reason */}
          {quote.revisionReason && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-purple-500" /> 修订原因</CardTitle></CardHeader>
              <CardContent>
                <div className="text-sm bg-purple-50/50 border border-purple-100 rounded-md p-3 text-purple-700 whitespace-pre-wrap">
                  {quote.revisionReason}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Version History */}
          {allQuotesForOpp.length > 1 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><GitBranch className="h-4 w-4" /> 版本历史</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {allQuotesForOpp.map((vq) => {
                  const vqStatusConf = QUOTE_STATUS_CONFIG[vq.status];
                  const isCurrent = vq.id === quote.id;
                  return (
                    <div
                      key={vq.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        isCurrent ? "bg-primary/5 border border-primary/20" : "hover:bg-muted/50"
                      )}
                      onClick={() => { if (!isCurrent) router.push(`/quotes/${vq.id}`); }}
                    >
                      <Badge variant="outline" className={cn(
                        "text-xs shrink-0",
                        vq.version > 1 ? "bg-purple-50 text-purple-600 border-purple-200" : "bg-gray-50 text-gray-500 border-gray-200"
                      )}>
                        V{vq.version}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-sm font-medium truncate", isCurrent && "text-primary")}>
                            {vq.title}
                          </span>
                          <Badge className={cn(vqStatusConf.className, "text-xs shrink-0")}>{vqStatusConf.label}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>¥{vq.total.toLocaleString()}</span>
                          <span>{format(new Date(vq.createdAt), 'yyyy-MM-dd')}</span>
                        </div>
                        {vq.revisionReason && (
                          <p className="text-xs text-purple-500 truncate mt-0.5">{vq.revisionReason}</p>
                        )}
                      </div>
                      {isCurrent && (
                        <Badge variant="secondary" className="text-xs shrink-0">当前</Badge>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> 确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除报价单 &ldquo;{quote.title}&rdquo; 吗？此操作不可撤销。
            </DialogDescription>
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
