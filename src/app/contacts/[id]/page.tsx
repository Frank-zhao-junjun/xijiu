'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Mail, Phone, User, Building2, Send } from 'lucide-react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { SendEmailDialog } from '@/components/email/send-email-dialog';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { contacts, opportunities, deleteContact } = useCRM();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);

  const contact = contacts.find(c => c.id === params.id);
  const contactOpportunities = opportunities.filter(o => o.contactId === params.id);

  if (!contact) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">联系人不存在</p>
      </div>
    );
  }

  const handleDelete = () => {
    deleteContact(contact.id);
    router.push('/contacts');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/contacts">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {contact.lastName}{contact.firstName}
                {contact.isPrimary && (
                  <Badge variant="secondary">主要联系人</Badge>
                )}
              </h2>
              <p className="text-muted-foreground">{contact.position}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {contact.email && (
            <Button variant="outline" onClick={() => setShowEmailDialog(true)}>
              <Send className="h-4 w-4 mr-2" />
              发送邮件
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/contacts/${contact.id}/edit`}>
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 基本信息 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>联系方式</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">邮箱</p>
                  <p className="text-sm">{contact.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">电话</p>
                  <p className="text-sm">{contact.phone || '-'}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">所属客户</p>
                <Link 
                  href={`/customers/${contact.customerId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {contact.customerName}
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 商机 */}
        <Card>
          <CardHeader>
            <CardTitle>相关机会</CardTitle>
          </CardHeader>
          <CardContent>
            {contactOpportunities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">暂无相关机会</p>
            ) : (
              <div className="space-y-4">
                {contactOpportunities.map(opp => (
                  <div key={opp.id} className="p-3 rounded-lg border">
                    <p className="font-medium truncate">{opp.title}</p>
                    <p className="text-sm text-muted-foreground">
                      ¥{opp.value.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 元信息 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>创建时间: {format(new Date(contact.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
            <span>更新时间: {format(new Date(contact.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除联系人 &ldquo;{contact.lastName}{contact.firstName}&rdquo; 吗？此操作不可撤销。
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
        entityType="contact"
        entityId={contact.id}
        entityName={`${contact.lastName}${contact.firstName}`}
        toEmail={contact.email || ''}
        toName={`${contact.lastName}${contact.firstName}`}
      />
    </div>
  );
}
