'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Trash2, DollarSign, Building2, User, Lightbulb, ArrowRightLeft, XCircle, Clock, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { LEAD_STATUS_CONFIG, LEAD_SOURCE_CONFIG } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
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
import { FollowUpTimeline } from '@/components/crm/follow-up-timeline';

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { leads, deleteLead, qualifyLead, disqualifyLead, refreshData } = useCRM();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDisqualifyDialog, setShowDisqualifyDialog] = useState(false);

  const lead = leads.find(l => l.id === params.id);

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">销售线索不存在</p>
      </div>
    );
  }

  const isQualified = lead.status === 'qualified';
  const isDisqualified = lead.status === 'disqualified';
  const statusConf = LEAD_STATUS_CONFIG[lead.status];
  const sourceConf = LEAD_SOURCE_CONFIG[lead.source];

  const handleDelete = () => {
    deleteLead(lead.id);
    router.push('/leads');
  };

  const handleQualify = () => {
    qualifyLead(lead.id, {
      opportunityTitle: lead.title,
      value: lead.estimatedValue,
      expectedCloseDate: '',
      notes: lead.notes || '',
    });
    router.push('/leads');
  };

  const handleDisqualify = () => {
    disqualifyLead(lead.id, '客户不符合条件');
    setShowDisqualifyDialog(false);
    router.push('/leads');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/leads">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{lead.title}</h2>
            <p className="text-muted-foreground">{lead.customerName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isQualified && !isDisqualified && (
            <>
              <Button onClick={handleQualify} className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500">
                <ArrowRightLeft className="h-4 w-4" />
                转为商机
              </Button>
              <Button variant="outline" onClick={() => setShowDisqualifyDialog(true)} className="gap-2 text-yellow-600 border-yellow-300 hover:bg-yellow-50">
                <XCircle className="h-4 w-4" />
                标记放弃
              </Button>
            </>
          )}
          {isQualified && (
            <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/20 text-sm px-3 py-1">
              <Sparkles className="h-4 w-4 mr-1" /> 已转为商机
            </Badge>
          )}
          {!isQualified && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              删除
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 线索详情 */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>线索详情</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">线索标题</p>
                <p className="font-medium">{lead.title}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">状态</p>
                <div className="flex items-center gap-2">
                  <Badge className={statusConf?.className}>{statusConf?.label}</Badge>
                  {isQualified && (
                    <Badge variant="outline" className="text-xs text-cyan-600 border-cyan-300">已转化</Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">预估价值</p>
                  <p className="font-medium">¥{lead.estimatedValue.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Lightbulb className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">来源</p>
                  <Badge variant="outline" className="gap-1">
                    <span>{sourceConf?.icon}</span>
                    {sourceConf?.label}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">转化概率</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 rounded-full"
                      style={{ width: `${lead.probability}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{lead.probability}%</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">客户</p>
                <Link
                  href={`/customers/${lead.customerId}`}
                  className="text-sm text-primary hover:underline"
                >
                  {lead.customerName}
                </Link>
              </div>
            </div>

            {lead.contactName && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">联系人</p>
                  <p className="text-sm">{lead.contactName}</p>
                </div>
              </div>
            )}

            {lead.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">备注</p>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{lead.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 状态流程 */}
        <Card>
          <CardHeader>
            <CardTitle>线索状态流程</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['new', 'contacted', 'qualified'] as const).map((stage, index) => {
              const stageConf = LEAD_STATUS_CONFIG[stage];
              const isActive = lead.status === stage;
              const isPast = ['new', 'contacted', 'qualified'].indexOf(lead.status) > index;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                    isActive ? "bg-primary text-primary-foreground" :
                    isPast ? "bg-green-500 text-white" :
                    "bg-muted"
                  )}>
                    {isPast ? '✓' : index + 1}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive && "text-primary"
                    )}>
                      {stageConf?.label}
                    </p>
                  </div>
                  {isActive && (
                    <Badge variant="secondary">当前</Badge>
                  )}
                </div>
              );
            })}

            {/* Disqualified branch */}
            {isDisqualified && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium bg-red-500 text-white">
                    ✕
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-500">已放弃</p>
                  </div>
                  <Badge variant="destructive">当前</Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 跟进记录 */}
      {!isQualified && (
        <FollowUpTimeline
          entityType="lead"
          entityId={lead.id}
          entityName={lead.title}
          onChange={refreshData}
        />
      )}

      {/* 元信息 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>创建时间: {format(new Date(lead.createdAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
            <span>更新时间: {format(new Date(lead.updatedAt), 'yyyy-MM-dd HH:mm', { locale: zhCN })}</span>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除销售线索 &ldquo;{lead.title}&rdquo; 吗？此操作不可撤销。
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

      {/* Disqualify Dialog */}
      <Dialog open={showDisqualifyDialog} onOpenChange={setShowDisqualifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-yellow-500" />
              确认放弃线索
            </DialogTitle>
            <DialogDescription>
              确定要放弃销售线索 &ldquo;{lead.title}&rdquo; 吗？放弃后该线索将不再活跃。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisqualifyDialog(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDisqualify}>
              确认放弃
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
