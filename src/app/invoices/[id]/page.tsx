'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Printer, Trash2, FileText, CheckCircle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { INVOICE_STATUS_CONFIG, type Invoice, type InvoiceStatus } from '@/lib/crm-types';
import { format } from 'date-fns';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices?id=${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setInvoice({
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
        });
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [params.id]);

  useEffect(() => { void fetchInvoice(); }, [fetchInvoice]);

  const handleAction = async (action: string, newStatus?: InvoiceStatus) => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          data: { id: invoice.id, status: newStatus || action },
        }),
      });
      fetchInvoice();
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!invoice || !confirm('确定要删除这张发票吗？')) return;
    try {
      await fetch(`/api/invoices?id=${invoice.id}`, { method: 'DELETE' });
      router.push('/invoices');
    } catch { /* silent */ }
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
              <Badge className={INVOICE_STATUS_CONFIG[invoice.status].className}>
                {INVOICE_STATUS_CONFIG[invoice.status].label}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              创建于 {format(new Date(invoice.createdAt), 'yyyy-MM-dd HH:mm')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {invoice.status === 'draft' && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => handleAction('issued', 'issued')}
                disabled={actionLoading}
              >
                <FileText className="mr-2 h-4 w-4" />
                开票
              </Button>
            </>
          )}
          {invoice.status === 'issued' && (
            <Button
              variant="outline"
              onClick={() => handleAction('paid', 'paid')}
              disabled={actionLoading}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              确认收款
            </Button>
          )}
          {(invoice.status === 'overdue' || invoice.status === 'paid') && (
            <Button
              variant="outline"
              onClick={() => handleAction('refunded', 'refunded')}
              disabled={actionLoading}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              退款
            </Button>
          )}
          {invoice.status === 'draft' && (
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </Button>
          )}
        </div>
      </div>

      {/* Invoice Content for Print */}
      <div className="invoice-content">
        {/* Company & Customer Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">销售方</h3>
                <p className="font-medium">某某公司</p>
                <p className="text-sm text-muted-foreground">税号：91110000XXXXXXXX</p>
                <p className="text-sm text-muted-foreground">地址：北京市朝阳区某某路123号</p>
                <p className="text-sm text-muted-foreground">电话：010-12345678</p>
              </div>
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">购买方</h3>
                <p className="font-medium">{invoice.customerName}</p>
                {invoice.taxId && (
                  <p className="text-sm text-muted-foreground">税号：{invoice.taxId}</p>
                )}
                {invoice.billingAddress && (
                  <p className="text-sm text-muted-foreground">地址：{invoice.billingAddress}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>发票明细</span>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" />
                打印
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">序号</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">产品/服务</th>
                    <th className="px-4 py-3 text-center text-sm font-medium">数量</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">单价</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">折扣</th>
                    <th className="px-4 py-3 text-right text-sm font-medium">金额</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* 示例明细，实际应从 invoice.items 获取 */}
                  <tr>
                    <td className="px-4 py-3 text-sm">1</td>
                    <td className="px-4 py-3 text-sm">
                      <div>产品/服务名称</div>
                      <div className="text-xs text-muted-foreground">描述</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center">1</td>
                    <td className="px-4 py-3 text-sm text-right">¥1,000.00</td>
                    <td className="px-4 py-3 text-sm text-right">¥0.00</td>
                    <td className="px-4 py-3 text-sm text-right">¥1,000.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Amount Summary */}
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">小计</span>
                  <span>¥{invoice.subtotal.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>折扣</span>
                  <span>-¥0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">税率 ({invoice.taxRate * 100}%)</span>
                  <span>¥{invoice.tax.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>价税合计</span>
                  <span className="text-primary">¥{invoice.total.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Amount in Words */}
            <div className="mt-4 text-right">
              <span className="text-muted-foreground">
                大写金额：{numToChinese(invoice.total)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">开票日期</p>
                <p className="font-medium">{format(new Date(invoice.issueDate), 'yyyy-MM-dd')}</p>
              </div>
              {invoice.dueDate && (
                <div>
                  <p className="text-muted-foreground">到期日期</p>
                  <p className="font-medium">{format(new Date(invoice.dueDate), 'yyyy-MM-dd')}</p>
                </div>
              )}
              {invoice.paidDate && (
                <div>
                  <p className="text-muted-foreground">收款日期</p>
                  <p className="font-medium">{format(new Date(invoice.paidDate), 'yyyy-MM-dd')}</p>
                </div>
              )}
              {invoice.paymentMethod && (
                <div>
                  <p className="text-muted-foreground">收款方式</p>
                  <p className="font-medium">
                    {invoice.paymentMethod === 'bank_transfer' && '银行转账'}
                    {invoice.paymentMethod === 'cash' && '现金'}
                    {invoice.paymentMethod === 'credit_card' && '信用卡'}
                    {invoice.paymentMethod === 'other' && '其他'}
                  </p>
                </div>
              )}
              {invoice.orderNumber && (
                <div>
                  <p className="text-muted-foreground">关联订单</p>
                  <p className="font-medium">{invoice.orderNumber}</p>
                </div>
              )}
            </div>
            {invoice.notes && (
              <div className="mt-4">
                <p className="text-muted-foreground">备注</p>
                <p className="font-medium">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .invoice-content {
            padding: 20px;
          }
          button, a, .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// 数字转中文大写
function numToChinese(num: number): string {
  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];
  
  let s = '';
  const numStr = Math.round(num * 100).toString();
  const dotIndex = numStr.indexOf('.');
  
  if (dotIndex === -1) {
    // 整数部分
    for (let i = 0; i < numStr.length; i++) {
      const n = parseInt(numStr[i]);
      const p = numStr.length - i - 1;
      if (n !== 0) {
        s += digit[n] + unit[0][Math.floor(p / 4)] || '';
        s += unit[1][p % 4] || '';
      } else if (p % 4 === 0) {
        s += unit[0][Math.floor(p / 4)] || '';
      }
    }
    s += '整';
  } else {
    // 小数部分
    const intPart = numStr.substring(0, dotIndex);
    const decPart = numStr.substring(dotIndex + 1);
    
    for (let i = 0; i < intPart.length; i++) {
      const n = parseInt(intPart[i]);
      const p = intPart.length - i - 1;
      if (n !== 0) {
        s += digit[n] + unit[0][Math.floor(p / 4)] || '';
        s += unit[1][p % 4] || '';
      } else if (p % 4 === 0) {
        s += unit[0][Math.floor(p / 4)] || '';
      }
    }
    
    for (let i = 0; i < decPart.length && i < 2; i++) {
      const n = parseInt(decPart[i]);
      if (n !== 0) {
        s += digit[n] + fraction[i];
      }
    }
  }
  
  return s || '零元整';
}
