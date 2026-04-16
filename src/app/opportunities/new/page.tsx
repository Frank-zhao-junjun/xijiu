'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { OpportunityStage } from '@/lib/crm-types';

const stages: { value: OpportunityStage; label: string; probability: number }[] = [
  { value: 'qualified', label: '商机确认', probability: 20 },
  { value: 'discovery', label: '需求调研', probability: 30 },
  { value: 'proposal', label: '方案报价', probability: 45 },
  { value: 'negotiation', label: '商务洽谈', probability: 65 },
  { value: 'contract', label: '合同签署', probability: 85 },
  { value: 'closed_won', label: '成交', probability: 100 },
  { value: 'closed_lost', label: '失败', probability: 0 },
];

function NewOpportunityForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers, contacts, addOpportunity } = useCRM();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    customerId: '',
    contactId: 'none',
    value: '',
    stage: 'qualified' as OpportunityStage,
    probability: 10,
    expectedCloseDate: '',
    description: '',
  });

  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      setFormData(prev => ({ ...prev, customerId }));
    }
  }, [searchParams]);

  const selectedCustomer = customers.find(c => c.id === formData.customerId);
  const customerContacts = contacts.filter(c => c.customerId === formData.customerId);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      if (field === 'stage') {
        const stage = stages.find(s => s.value === value);
        if (stage) {
          newData.probability = stage.probability;
        }
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    setLoading(true);
    
    try {
      const selectedContact = formData.contactId !== 'none' ? contacts.find(c => c.id === formData.contactId) : undefined;
      addOpportunity({
        ...formData,
        contactId: formData.contactId === 'none' ? undefined : formData.contactId,
        value: parseFloat(formData.value) || 0,
        customerName: selectedCustomer.company,
        contactName: selectedContact ? `${selectedContact.lastName}${selectedContact.firstName}` : undefined,
      });
      router.push('/opportunities');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>商机信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">商机名称 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="输入商机名称"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">客户 *</Label>
              <Select 
                value={formData.customerId} 
                onValueChange={(v) => handleChange('customerId', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择客户" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.company}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactId">联系人</Label>
              <Select 
                value={formData.contactId} 
                onValueChange={(v) => handleChange('contactId', v)}
                disabled={!formData.customerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择联系人" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不选择联系人</SelectItem>
                  {customerContacts.map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.lastName}{contact.firstName} - {contact.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="value">金额 *</Label>
              <Input
                id="value"
                type="number"
                value={formData.value}
                onChange={(e) => handleChange('value', e.target.value)}
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">阶段</Label>
              <Select 
                value={formData.stage} 
                onValueChange={(v) => handleChange('stage', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.value} value={stage.value}>
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="probability">概率</Label>
              <Input
                id="probability"
                type="number"
                value={formData.probability}
                onChange={(e) => handleChange('probability', e.target.value)}
                min="0"
                max="100"
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedCloseDate">预计成交日期 *</Label>
            <Input
              id="expectedCloseDate"
              type="date"
              value={formData.expectedCloseDate}
              onChange={(e) => handleChange('expectedCloseDate', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="机会描述..."
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" asChild>
          <Link href="/opportunities">取消</Link>
        </Button>
        <Button type="submit" disabled={loading || !formData.customerId}>
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>
      </div>
    </form>
  );
}

export default function NewOpportunityPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/opportunities">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">新建商机</h2>
      </div>

      <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
        <NewOpportunityForm />
      </Suspense>
    </div>
  );
}
