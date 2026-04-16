'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowLeft, Plus, X, FileBarChart, Building2, Briefcase, FileText, AlertCircle } from 'lucide-react';
import { type Contract, type ContractStatus } from '@/lib/crm-types';

interface MilestoneForm {
  id?: string;
  name: string;
  description: string;
  expectedDate: string;
  isCompleted: boolean;
}

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerId: '',
    customerName: '',
    opportunityId: '',
    opportunityName: '',
    quoteId: '',
    quoteTitle: '',
    amount: 0,
    signingDate: '',
    effectiveDate: '',
    expirationDate: '',
    terms: '',
    customTerms: '',
    notes: '',
  });

  const [milestones, setMilestones] = useState<MilestoneForm[]>([]);

  const fetchContract = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts?id=${id}`);
      if (res.ok) {
        const data = await res.json();
        
        // Check if contract is editable (only draft status)
        if (data.status !== 'draft') {
          setError('只有草稿状态的合同才能编辑');
          setLoading(false);
          return;
        }

        setContract({
          id: data.id,
          contractNumber: data.contract_number,
          customerId: data.customer_id,
          customerName: data.customer_name,
          opportunityId: data.opportunity_id,
          opportunityName: data.opportunity_name,
          quoteId: data.quote_id,
          quoteTitle: data.quote_title,
          status: data.status as ContractStatus,
          amount: Number(data.amount),
          signingDate: data.signing_date,
          effectiveDate: data.effective_date,
          expirationDate: data.expiration_date,
          terms: data.terms,
          customTerms: data.custom_terms,
          notes: data.notes,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });

        setForm({
          customerId: data.customer_id || '',
          customerName: data.customer_name || '',
          opportunityId: data.opportunity_id || '',
          opportunityName: data.opportunity_name || '',
          quoteId: data.quote_id || '',
          quoteTitle: data.quote_title || '',
          amount: Number(data.amount) || 0,
          signingDate: data.signing_date ? data.signing_date.split('T')[0] : '',
          effectiveDate: data.effective_date ? data.effective_date.split('T')[0] : '',
          expirationDate: data.expiration_date ? data.expiration_date.split('T')[0] : '',
          terms: data.terms || '',
          customTerms: data.custom_terms || '',
          notes: data.notes || '',
        });

        setMilestones((data.milestones || []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          name: m.name as string,
          description: m.description as string || '',
          expectedDate: m.expected_date ? (m.expected_date as string).split('T')[0] : '',
          isCompleted: m.is_completed as boolean,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (id) void fetchContract();
  }, [id, fetchContract]);

  const updateMilestone = (index: number, field: keyof MilestoneForm, value: string) => {
    setMilestones(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addMilestone = () => {
    setMilestones(prev => [...prev, { name: '', description: '', expectedDate: '', isCompleted: false }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          data: {
            id,
            customerId: form.customerId || null,
            customerName: form.customerName || null,
            opportunityId: form.opportunityId || null,
            opportunityName: form.opportunityName || null,
            quoteId: form.quoteId || null,
            quoteTitle: form.quoteTitle || null,
            amount: form.amount,
            signingDate: form.signingDate || null,
            effectiveDate: form.effectiveDate || null,
            expirationDate: form.expirationDate || null,
            terms: form.terms,
            customTerms: form.customTerms || null,
            notes: form.notes || null,
          },
        }),
      });
      if (res.ok) {
        // Update milestones
        for (let i = 0; i < milestones.length; i++) {
          const m = milestones[i];
          if (m.id) {
            // Update existing milestone
            await fetch('/api/contracts/milestones', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update',
                data: {
                  id: m.id,
                  name: m.name,
                  description: m.description || null,
                  expectedDate: m.expectedDate || null,
                  sortOrder: i,
                },
              }),
            });
          } else {
            // Create new milestone
            await fetch('/api/contracts/milestones', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'create',
                data: {
                  contractId: id,
                  name: m.name,
                  description: m.description || null,
                  expectedDate: m.expectedDate || null,
                  sortOrder: i,
                },
              }),
            });
          }
        }
        router.push(`/contracts/${id}`);
      }
    } catch { /* silent */ }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  if (error || !contract) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-orange-500" />
        <p className="text-lg font-medium">{error || '合同不存在'}</p>
        <Button variant="outline" onClick={() => router.push('/contracts')}>
          返回合同列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/contracts/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">编辑合同</h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5" /> 基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info Display */}
              {form.customerName && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 text-sm">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">客户:</span>
                    <span className="text-foreground font-medium">{form.customerName}</span>
                  </div>
                  {form.quoteTitle && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">报价单:</span>
                      <span className="text-foreground font-medium">{form.quoteTitle}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>签约日期</Label>
                  <Input
                    type="date"
                    value={form.signingDate}
                    onChange={e => setForm(prev => ({ ...prev, signingDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>合同金额</Label>
                  <Input
                    type="number"
                    value={form.amount}
                    onChange={e => setForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                    placeholder="输入合同金额"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>生效日期</Label>
                  <Input
                    type="date"
                    value={form.effectiveDate}
                    onChange={e => setForm(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>到期日期</Label>
                  <Input
                    type="date"
                    value={form.expirationDate}
                    onChange={e => setForm(prev => ({ ...prev, expirationDate: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> 履约节点配置
                </CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={addMilestone}>
                  <Plus className="h-3 w-3" /> 添加节点
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>节点名称</TableHead>
                      <TableHead>说明</TableHead>
                      <TableHead className="w-[140px]">预计完成日期</TableHead>
                      <TableHead className="w-[40px]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {milestones.map((milestone, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Input
                            value={milestone.name}
                            onChange={e => updateMilestone(idx, 'name', e.target.value)}
                            placeholder="如：预付款到账"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={milestone.description}
                            onChange={e => updateMilestone(idx, 'description', e.target.value)}
                            placeholder="节点描述"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={milestone.expectedDate}
                            onChange={e => updateMilestone(idx, 'expectedDate', e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>
                          {milestones.length > 1 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeMilestone(idx)}>
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

          {/* Terms */}
          <Card>
            <CardHeader>
              <CardTitle>合同条款</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>标准条款</Label>
                <Textarea
                  value={form.terms}
                  onChange={e => setForm(prev => ({ ...prev, terms: e.target.value }))}
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>自定义条款</Label>
                <Textarea
                  value={form.customTerms}
                  onChange={e => setForm(prev => ({ ...prev, customTerms: e.target.value }))}
                  placeholder="添加额外的自定义条款（可选）"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  value={form.notes}
                  onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="备注信息（可选）"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Summary */}
          <Card>
            <CardHeader><CardTitle>合同摘要</CardTitle></CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">合同编号</span>
                <span className="font-medium">{contract.contractNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">客户</span>
                <span className="font-medium">{form.customerName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">关联报价单</span>
                <span className="font-medium">{form.quoteTitle || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">履约节点</span>
                <span className="font-medium">{milestones.filter(m => m.name).length} 个</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>合同金额</span>
                  <span className="text-primary">¥{form.amount.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存更改'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => router.push(`/contracts/${id}`)}
              >
                取消
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
