'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Mail, Phone, Globe, MapPin, FileText, Send, Tag } from 'lucide-react';
import Link from 'next/link';
import { CustomerStatus } from '@/lib/crm-types';
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
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { zhCN } from 'date-fns/locale';
import { SendEmailDialog } from '@/components/email/send-email-dialog';
import type { Tag as TagType } from '@/storage/database/shared/schema';

const statusLabels: Record<CustomerStatus, { label: string; className: string }> = {
  active: { label: '活跃', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  inactive: { label: '非活跃', className: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  prospect: { label: '潜在客户', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { customers, contacts, opportunities, deleteCustomer } = useCRM();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [customerTags, setCustomerTags] = useState<TagType[]>([]);
  const [allTags, setAllTags] = useState<TagType[]>([]);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  const customer = customers.find(c => c.id === params.id);
  const customerContacts = contacts.filter(c => c.customerId === params.id);
  const customerOpportunities = opportunities.filter(o => o.customerId === params.id);

  // 获取客户标签
  const fetchCustomerTags = useCallback(async () => {
    if (!customer?.id) return;
    try {
      const res = await fetch(`/api/customers/tags?customerId=${customer.id}`);
      if (res.ok) {
        const data = await res.json();
        setCustomerTags(data);
      }
    } catch (err) {
      console.error('获取客户标签失败:', err);
    }
  }, [customer?.id]);

  // 获取所有标签
  const fetchAllTags = useCallback(async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) {
        const data = await res.json();
        setAllTags(data);
      }
    } catch (err) {
      console.error('获取标签列表失败:', err);
    }
  }, []);

  useEffect(() => {
    fetchCustomerTags();
  }, [fetchCustomerTags]);

  // 添加标签到客户
  const addTagToCustomer = async (tagId: string) => {
    if (!customer?.id) return;
    setLoadingTags(true);
    try {
      const res = await fetch('/api/customers/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.id, tagId }),
      });
      if (res.ok) {
        await fetchCustomerTags();
      } else {
        const error = await res.json();
        alert(error.error || '添加标签失败');
      }
    } catch (err) {
      console.error('添加标签失败:', err);
    } finally {
      setLoadingTags(false);
    }
  };

  // 从客户移除标签
  const removeTagFromCustomer = async (tagId: string) => {
    if (!customer?.id) return;
    setLoadingTags(true);
    try {
      const res = await fetch(`/api/customers/tags?customerId=${customer.id}&tagId=${tagId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchCustomerTags();
      } else {
        const error = await res.json();
        alert(error.error || '移除标签失败');
      }
    } catch (err) {
      console.error('移除标签失败:', err);
    } finally {
      setLoadingTags(false);
    }
  };

  // 打开标签选择器
  const openTagSelector = async () => {
    await fetchAllTags();
    setShowTagSelector(true);
  };

  if (!customer) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">客户不存在</p>
      </div>
    );
  }

  const handleDelete = () => {
    deleteCustomer(customer.id);
    router.push('/customers');
  };

  // 未分配的标签
  const unassignedTags = allTags.filter(
    tag => !customerTags.some(ct => ct.id === tag.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{customer.name}</h2>
            <p className="text-muted-foreground">{customer.company}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {customer.email && (
            <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              发送邮件
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/customers/${customer.id}/edit`}>
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

      {/* 客户标签 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            客户标签
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={openTagSelector}>
            <Edit className="h-3 w-3 mr-1" />
            管理标签
          </Button>
        </CardHeader>
        <CardContent>
          {customerTags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customerTags.map(tag => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    color: tag.color,
                    border: `1px solid ${tag.color}30`,
                  }}
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() => removeTagFromCustomer(tag.id)}
                    className="ml-1 hover:opacity-70 rounded-full p-0.5 hover:bg-black/10"
                    disabled={loadingTags}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">暂无标签</p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 基本信息 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">客户名称</p>
                <p className="font-medium">{customer.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">公司名称</p>
                <p className="font-medium">{customer.company}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">状态</p>
                <Badge variant="outline" className={cn(statusLabels[customer.status].className)}>
                  {statusLabels[customer.status].label}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">行业</p>
                <p className="font-medium">{customer.industry || '-'}</p>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p className="text-sm">{customer.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">电话</p>
                  <p className="text-sm">{customer.phone || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">网站</p>
                  <p className="text-sm">{customer.website || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">地址</p>
                  <p className="text-sm">{customer.address || '-'}</p>
                </div>
              </div>
            </div>

            {customer.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">备注</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{customer.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 客户联系人 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>联系人</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/contacts/new?customerId=${customer.id}`}>
                添加
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {customerContacts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无联系人</p>
            ) : (
              <div className="space-y-4">
                {customerContacts.map(contact => (
                  <div key={contact.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {contact.lastName}{contact.firstName}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {contact.lastName}{contact.firstName}
                        {contact.isPrimary && (
                          <Badge variant="secondary" className="ml-2 text-xs">主要</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{contact.position}</p>
                      <p className="text-xs text-muted-foreground">{contact.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 商机 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>商机</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/opportunities/new?customerId=${customer.id}`}>
              添加
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {customerOpportunities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">暂无商机</p>
          ) : (
            <div className="space-y-4">
              {customerOpportunities.map(opp => (
                <div key={opp.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{opp.title}</p>
                    <p className="text-sm text-muted-foreground">
                      预计 {format(new Date(opp.expectedCloseDate), 'yyyy/MM/dd', { locale: zhCN })} 截止
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium">¥{opp.value.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{opp.probability}% 概率</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 元信息 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>创建时间: {format(new Date(customer.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
            <span>更新时间: {format(new Date(customer.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
          </div>
        </CardContent>
      </Card>

      {/* 活动追踪 */}
      <ActivityTimeline 
        entityId={customer.id}
        entityType="customer"
        showFilters={false}
        title={`关于 "${customer.name}" 的活动`}
      />

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除客户 &ldquo;{customer.name}&rdquo; 吗？此操作不可撤销，将同时删除相关的联系人和商机。
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

      {/* Send Email Dialog */}
      <SendEmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        entityType="customer"
        entityId={customer.id}
        entityName={customer.name}
        toEmail={customer.email || ''}
        toName={customer.name}
      />

      {/* 标签选择器 Dialog */}
      <Dialog open={showTagSelector} onOpenChange={setShowTagSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>管理客户标签</DialogTitle>
            <DialogDescription>
              选择要添加到该客户的标签
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {unassignedTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unassignedTags.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => addTagToCustomer(tag.id)}
                    disabled={loadingTags}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105"
                    style={{
                      backgroundColor: `${tag.color}15`,
                      color: tag.color,
                      border: `1px solid ${tag.color}30`,
                    }}
                  >
                    <span className="text-base">+</span>
                    {tag.name}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                所有标签已添加，或暂无可用标签
              </p>
            )}
            <Separator />
            <div className="text-sm text-muted-foreground">
              <p>已有标签：点击标签右上角 × 可移除</p>
              <p className="mt-1">
                <Link href="/settings/tags" className="text-blue-600 hover:underline" onClick={() => setShowTagSelector(false)}>
                  创建新标签
                </Link>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagSelector(false)}>
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
