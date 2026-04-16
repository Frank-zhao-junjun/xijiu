'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Lightbulb, Building2, User, DollarSign, FileText } from 'lucide-react';
import { LEAD_SOURCE_CONFIG, LeadSourceType } from '@/lib/crm-types';
import Link from 'next/link';

export default function NewLeadPage() {
  const router = useRouter();
  const { addLead, customers } = useCRM();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    source: 'website',
    customerId: '',
    contactId: 'none',
    estimatedValue: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.customerId) {
      alert('请填写必填项');
      return;
    }

    const customer = customers.find(c => c.id === form.customerId);
    if (!customer) return;

    setLoading(true);
    try {
      await addLead({
        title: form.title,
        source: form.source as LeadSourceType,
        customerId: form.customerId,
        customerName: customer.company,
        contactId: form.contactId === 'none' ? undefined : form.contactId,
        contactName: form.contactId !== 'none' ? getContactName(form.contactId) : undefined,
        estimatedValue: Number(form.estimatedValue) || 0,
        status: 'new',
        probability: 10,
        notes: form.notes || undefined,
      });
      router.push('/leads');
    } catch (error) {
      console.error('创建线索失败:', error);
      alert('创建失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getContactName = (contactId: string) => {
    return contactId; // 简化处理
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/leads">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">新建销售线索</h1>
          <p className="text-muted-foreground">创建新的销售线索，开始销售流程</p>
        </div>
      </div>

      {/* Form */}
      <Card className="card-hover">
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 线索标题 */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                线索标题 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({...form, title: e.target.value})}
                placeholder="输入线索标题，如：XX公司ERP需求"
                required
              />
            </div>

            {/* 来源 */}
            <div className="space-y-2">
              <Label htmlFor="source" className="flex items-center gap-2">
                来源渠道
              </Label>
              <Select value={form.source} onValueChange={(v) => setForm({...form, source: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择来源" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LEAD_SOURCE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 客户 */}
            <div className="space-y-2">
              <Label htmlFor="customer" className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-500" />
                关联客户 <span className="text-red-500">*</span>
              </Label>
              <Select value={form.customerId} onValueChange={(v) => setForm({...form, customerId: v, contactId: 'none'})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company} - {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 联系人 */}
            <div className="space-y-2">
              <Label htmlFor="contact" className="flex items-center gap-2">
                <User className="h-4 w-4 text-green-500" />
                联系人
              </Label>
              <Select value={form.contactId} onValueChange={(v) => setForm({...form, contactId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择联系人（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">无</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 预估价值 */}
            <div className="space-y-2">
              <Label htmlFor="value" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-500" />
                预估价值 (¥)
              </Label>
              <Input
                id="value"
                type="number"
                value={form.estimatedValue}
                onChange={(e) => setForm({...form, estimatedValue: e.target.value})}
                placeholder="输入预估金额"
              />
            </div>

            {/* 备注 */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                备注
              </Label>
              <textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({...form, notes: e.target.value})}
                placeholder="补充线索相关信息..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
              >
                {loading ? '创建中...' : '创建线索'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
