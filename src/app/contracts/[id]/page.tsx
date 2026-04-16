'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Building2, Briefcase, FileText, Edit, Trash2, Calendar, CheckCircle, Play, Ban, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { CONTRACT_STATUS_CONFIG, type Contract, type ContractStatus, type ContractMilestone } from '@/lib/crm-types';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ActivityTimeline } from '@/components/crm/activity-timeline';
import { cn } from '@/lib/utils';

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [contract, setContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<ContractMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchContract = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/contracts?id=${id}`);
      if (res.ok) {
        const data = await res.json();
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
        setMilestones((data.milestones || []).map((m: Record<string, unknown>) => ({
          id: m.id as string,
          contractId: m.contract_id as string,
          name: m.name as string,
          description: m.description as string | undefined,
          expectedDate: m.expected_date as string | undefined,
          completedDate: m.completed_date as string | undefined,
          isCompleted: m.is_completed as boolean,
          sortOrder: m.sort_order as number,
        })));
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => {
    if (id) void fetchContract();
  }, [id, fetchContract]);

  const handleAction = async (action: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, id }),
      });
      if (res.ok) {
        await fetchContract();
        setShowTerminateDialog(false);
      }
    } catch { /* silent */ }
    finally { setActionLoading(false); }
  };

  const handleMilestoneToggle = async (milestoneId: string, isCompleted: boolean) => {
    try {
      await fetch('/api/contracts/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: isCompleted ? 'complete' : 'update', 
          data: { id: milestoneId, isCompleted: false } 
        }),
      });
      await fetchContract();
    } catch { /* silent */ }
  };

  const handleDelete = async () => {
    try {
      await fetch('/api/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      router.push('/contracts');
    } catch { /* silent */ }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">加载中...</p></div>;
  }

  if (!contract) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">合同不存在</p></div>;
  }

  const statusConf = CONTRACT_STATUS_CONFIG[contract.status];
  const isEditable = contract.status === 'draft';
  const completedMilestones = milestones.filter(m => m.isCompleted).length;
  const progress = milestones.length > 0 ? (completedMilestones / milestones.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/contracts')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{contract.contractNumber}</h1>
              <Badge className={cn(statusConf.className)}>{statusConf.label}</Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              创建于 {format(new Date(contract.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isEditable && (
            <>
              <Button variant="outline" asChild>
                <Link href={`/contracts/${id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" /> 编辑
                </Link>
              </Button>
              <Button onClick={() => handleAction('start')} className="gap-2" disabled={actionLoading}>
                <Play className="h-4 w-4" /> 开始执行
              </Button>
            </>
          )}
          {contract.status === 'executing' && (
            <>
              <Button onClick={() => handleAction('complete')} className="gap-2 bg-green-600 hover:bg-green-700" disabled={actionLoading}>
                <CheckCircle className="h-4 w-4" /> 完成合同
              </Button>
              <Button variant="destructive" onClick={() => setShowTerminateDialog(true)} disabled={actionLoading}>
                <Ban className="h-4 w-4 mr-2" /> 终止合同
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Milestones */}
          {milestones.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" /> 履约进度
                  </CardTitle>
                  <span className="text-sm text-muted-foreground">
                    {completedMilestones}/{milestones.length} 已完成
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress Bar */}
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                
                {/* Milestone List */}
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div 
                      key={milestone.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg border transition-all",
                        milestone.isCompleted 
                          ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900" 
                          : "bg-muted/50 border-transparent"
                      )}
                    >
                      <button
                        onClick={() => contract.status === 'executing' && handleMilestoneToggle(milestone.id, !milestone.isCompleted)}
                        disabled={contract.status !== 'executing'}
                        className={cn(
                          "mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          milestone.isCompleted
                            ? "bg-green-500 border-green-500 text-white"
                            : "border-muted-foreground hover:border-primary"
                        )}
                      >
                        {milestone.isCompleted && <CheckCircle className="w-3 h-3" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={cn("font-medium", milestone.isCompleted && "line-through text-muted-foreground")}>
                            {milestone.name}
                          </p>
                          {milestone.expectedDate && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(milestone.expectedDate), 'yyyy-MM-dd')}
                            </span>
                          )}
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                        )}
                        {milestone.completedDate && (
                          <p className="text-xs text-green-600 mt-1">
                            已完成于 {format(new Date(milestone.completedDate), 'yyyy-MM-dd')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Terms */}
          {contract.terms && (
            <Card>
              <CardHeader><CardTitle>合同条款</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.terms}</p>
              </CardContent>
            </Card>
          )}

          {contract.customTerms && (
            <Card>
              <CardHeader><CardTitle>自定义条款</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.customTerms}</p>
              </CardContent>
            </Card>
          )}

          {contract.notes && (
            <Card>
              <CardHeader><CardTitle>备注</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Amount Summary */}
          <Card>
            <CardHeader><CardTitle>金额信息</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-between items-center font-bold text-2xl">
                <span>合同金额</span>
                <span className="text-primary">¥{contract.amount.toLocaleString()}</span>
              </div>
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
              
              {contract.customerName && (
                <div>
                  <span className="text-muted-foreground">客户</span>
                  <div className="mt-1">
                    <Link href={`/customers/${contract.customerId}`} className="text-primary hover:underline flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5" /> {contract.customerName}
                    </Link>
                  </div>
                </div>
              )}
              
              {contract.opportunityName && (
                <div>
                  <span className="text-muted-foreground">关联商机</span>
                  <div className="mt-1">
                    <Link href={`/opportunities/${contract.opportunityId}`} className="text-primary hover:underline flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" /> {contract.opportunityName}
                    </Link>
                  </div>
                </div>
              )}
              
              {contract.quoteTitle && (
                <div>
                  <span className="text-muted-foreground">关联报价单</span>
                  <div className="mt-1">
                    <Link href={`/quotes/${contract.quoteId}`} className="text-primary hover:underline flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> {contract.quoteTitle}
                    </Link>
                  </div>
                </div>
              )}

              <Separator />

              <div>
                <span className="text-muted-foreground">签约日期</span>
                <div className="mt-1 font-medium">
                  {contract.signingDate ? format(new Date(contract.signingDate), 'yyyy-MM-dd') : '-'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">生效日期</span>
                <div className="mt-1 font-medium">
                  {contract.effectiveDate ? format(new Date(contract.effectiveDate), 'yyyy-MM-dd') : '-'}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">到期日期</span>
                <div className="mt-1 font-medium">
                  {contract.expirationDate ? format(new Date(contract.expirationDate), 'yyyy-MM-dd') : '-'}
                </div>
              </div>

              <Separator />

              <div>
                <span className="text-muted-foreground">履约节点</span>
                <div className="mt-1 font-medium">{milestones.length} 个</div>
              </div>
              <div>
                <span className="text-muted-foreground">已完成</span>
                <div className="mt-1 font-medium text-green-600">{completedMilestones} 个</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 活动追踪 */}
      <ActivityTimeline 
        entityId={contract.id}
        entityType="contract"
        showFilters={false}
        title={`关于合同 "${contract.contractNumber}" 的活动`}
      />

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" /> 确认删除
            </DialogTitle>
            <DialogDescription>确定要删除这个合同吗？此操作不可撤销。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Terminate Dialog */}
      <AlertDialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" /> 确认终止合同
            </AlertDialogTitle>
            <AlertDialogDescription>
              终止合同后，将无法恢复。确定要终止这份合同吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleAction('terminate')} className="bg-orange-600 hover:bg-orange-700">
              确认终止
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
