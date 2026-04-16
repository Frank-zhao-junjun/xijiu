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
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

function NewContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { customers, addContact } = useCRM();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    customerId: '',
    isPrimary: false,
  });

  useEffect(() => {
    const customerId = searchParams.get('customerId');
    if (customerId) {
      setFormData(prev => ({ ...prev, customerId }));
    }
  }, [searchParams]);

  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    
    setLoading(true);
    
    try {
      addContact({
        ...formData,
        customerName: selectedCustomer.company,
      });
      router.push('/contacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="lastName">姓 *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="输入姓"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">名 *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="输入名"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerId">所属客户 *</Label>
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
                    {customer.company} - {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">职位</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleChange('position', e.target.value)}
              placeholder="如：销售经理"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="example@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">电话</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="138-0000-0000"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isPrimary">设为主要联系人</Label>
              <p className="text-sm text-muted-foreground">
                主要联系人将显示在客户信息页
              </p>
            </div>
            <Switch
              id="isPrimary"
              checked={formData.isPrimary}
              onCheckedChange={(checked) => handleChange('isPrimary', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" asChild>
          <Link href="/contacts">取消</Link>
        </Button>
        <Button type="submit" disabled={loading || !formData.customerId}>
          <Save className="h-4 w-4 mr-2" />
          保存
        </Button>
      </div>
    </form>
  );
}

export default function NewContactPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/contacts">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h2 className="text-2xl font-bold">新建联系人</h2>
      </div>

      <Suspense fallback={<div className="text-center py-8">加载中...</div>}>
        <NewContactForm />
      </Suspense>
    </div>
  );
}
