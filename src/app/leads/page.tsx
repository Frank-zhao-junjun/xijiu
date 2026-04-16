'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCRM } from '@/lib/crm-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, Building2, DollarSign, Lightbulb, MoreVertical, ArrowRightLeft, XCircle, Trash2, Sparkles, Clock, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { LEAD_STATUS_CONFIG, LEAD_SOURCE_CONFIG } from '@/lib/crm-types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { QuickFollowUp } from '@/components/crm/quick-follow-up';

const statusConfig = LEAD_STATUS_CONFIG;
const sourceConfig = LEAD_SOURCE_CONFIG;

export default function LeadsPage() {
  const router = useRouter();
  const { leads, qualifyLead, disqualifyLead, deleteLead, contacts } = useCRM();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [qualifyDialog, setQualifyDialog] = useState<{ open: boolean; lead: typeof leads[0] | null }>({ open: false, lead: null });
  const [qualifyForm, setQualifyForm] = useState({
    opportunityTitle: '',
    value: '',
    contactId: 'none',
    expectedCloseDate: '',
    notes: '',
  });
  const [quickFollowUp, setQuickFollowUp] = useState<{ open: boolean; entityId: string; entityName: string }>({
    open: false, entityId: '', entityName: '',
  });

  // 过滤线索（排除已放弃的）
  const activeLeads = leads.filter(l => l.status !== 'disqualified');
  
  const filteredLeads = activeLeads.filter(lead => {
    const matchesSearch = 
      lead.title.toLowerCase().includes(search.toLowerCase()) ||
      lead.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // 按状态分组统计
  const statusCounts = {
    new: activeLeads.filter(l => l.status === 'new').length,
    contacted: activeLeads.filter(l => l.status === 'contacted').length,
    qualified: activeLeads.filter(l => l.status === 'qualified').length,
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteLead(deleteId);
      setDeleteId(null);
    }
  };

  const handleQualify = () => {
    if (qualifyDialog.lead) {
      qualifyLead(qualifyDialog.lead.id, {
        opportunityTitle: qualifyForm.opportunityTitle || qualifyDialog.lead.title,
        value: Number(qualifyForm.value) || qualifyDialog.lead.estimatedValue,
        contactId: qualifyForm.contactId === 'none' ? undefined : qualifyForm.contactId,
        expectedCloseDate: qualifyForm.expectedCloseDate,
        notes: qualifyForm.notes,
      });
      setQualifyDialog({ open: false, lead: null });
      setQualifyForm({ opportunityTitle: '', value: '', contactId: '', expectedCloseDate: '', notes: '' });
    }
  };

  const openQualifyDialog = (lead: typeof leads[0]) => {
    setQualifyDialog({ open: true, lead });
    setQualifyForm({
      opportunityTitle: lead.title,
      value: lead.estimatedValue.toString(),
      contactId: lead.contactId || 'none',
      expectedCloseDate: '',
      notes: lead.notes || '',
    });
  };

  const handleDisqualify = (leadId: string) => {
    disqualifyLead(leadId, '客户不符合条件');
  };

  // 获取线索关联的客户联系人
  const getContactsByCustomer = (customerId: string) => {
    return contacts.filter(c => c.customerId === customerId);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-transparent to-amber-500/5 rounded-3xl -z-10" />
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">销售线索</h1>
            <p className="text-muted-foreground mt-1">
              共 {filteredLeads.length} 条线索，总预估价值 ¥{filteredLeads.reduce((sum, l) => sum + l.estimatedValue, 0).toLocaleString()}
            </p>
          </div>
          <Button 
            onClick={() => router.push('/leads/new')}
            className="gap-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 shadow-lg shadow-yellow-500/25 transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            新建线索
          </Button>
          <Link href="/leads/kanban">
            <Button variant="outline" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              看板视图
            </Button>
          </Link>
        </div>
      </div>

      {/* 状态统计卡片 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">新建</p>
                <p className="text-2xl font-bold">{statusCounts.new}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-400 to-slate-500 flex items-center justify-center">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已联系</p>
                <p className="text-2xl font-bold">{statusCounts.contacted}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Phone className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已Qualified</p>
                <p className="text-2xl font-bold">{statusCounts.qualified}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-hover bg-gradient-to-br from-yellow-500/10 to-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">线索总额</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ¥{activeLeads.reduce((sum, l) => sum + l.estimatedValue, 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-hover">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索线索名称或客户..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="new">新建</SelectItem>
                <SelectItem value="contacted">已联系</SelectItem>
                <SelectItem value="qualified">已Qualified</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="card-hover">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>线索信息</TableHead>
                <TableHead>来源</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>预估价值</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无销售线索
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => {
                  const isQualified = lead.status === 'qualified';
                  return (
                  <TableRow 
                    key={lead.id} 
                    className={cn(
                      "group",
                      isQualified ? "cursor-default bg-muted/30" : "cursor-pointer"
                    )}
                    onClick={() => !isQualified && router.push(`/leads/${lead.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                          <Lightbulb className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{lead.title}</p>
                          <p className="text-xs text-muted-foreground">
                            转化概率 {lead.probability}%
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        <span>{sourceConfig[lead.source]?.icon}</span>
                        {sourceConfig[lead.source]?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.customerName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium text-yellow-600 dark:text-yellow-400">
                        <DollarSign className="h-4 w-4" />
                        {lead.estimatedValue.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Badge className={statusConfig[lead.status]?.className}>
                          {statusConfig[lead.status]?.label}
                        </Badge>
                        {isQualified && (
                          <Badge variant="outline" className="text-xs text-cyan-600 border-cyan-300">
                            已转化
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(lead.createdAt), 'yyyy-MM-dd')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {lead.status === 'qualified' ? (
                            <DropdownMenuItem disabled className="gap-2 text-muted-foreground cursor-not-allowed">
                              <Sparkles className="h-4 w-4" />
                              已转为商机
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => setQuickFollowUp({ open: true, entityId: lead.id, entityName: lead.title })} className="gap-2">
                                <Clock className="h-4 w-4" />
                                快捷跟进
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openQualifyDialog(lead)} className="gap-2">
                                <ArrowRightLeft className="h-4 w-4" />
                                转为机会
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDisqualify(lead.id)} 
                                className="gap-2 text-yellow-600"
                              >
                                <XCircle className="h-4 w-4" />
                                标记放弃
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => setDeleteId(lead.id)} 
                                className="gap-2 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                删除
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              确认删除
            </DialogTitle>
            <DialogDescription>
              确定要删除这条销售线索吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Qualified 转换对话框 */}
      <Dialog open={qualifyDialog.open} onOpenChange={(open) => !open && setQualifyDialog({ open: false, lead: null })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-cyan-500" />
              线索转为商机
            </DialogTitle>
            <DialogDescription>
              将 &ldquo;{qualifyDialog.lead?.title}&rdquo; 转为正式的商机
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">商机标题</label>
              <Input 
                value={qualifyForm.opportunityTitle} 
                onChange={(e) => setQualifyForm({...qualifyForm, opportunityTitle: e.target.value})}
                placeholder="输入商机名称"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">机会金额 (¥)</label>
              <Input 
                type="number"
                value={qualifyForm.value} 
                onChange={(e) => setQualifyForm({...qualifyForm, value: e.target.value})}
                placeholder="输入预估金额"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">决策联系人</label>
              <Select value={qualifyForm.contactId} onValueChange={(v) => setQualifyForm({...qualifyForm, contactId: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="选择联系人（可选）" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">不选择联系人</SelectItem>
                  {qualifyDialog.lead && getContactsByCustomer(qualifyDialog.lead.customerId).map(contact => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.firstName} {contact.lastName} - {contact.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">预计成交日期</label>
              <Input 
                type="date"
                value={qualifyForm.expectedCloseDate} 
                onChange={(e) => setQualifyForm({...qualifyForm, expectedCloseDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">备注</label>
              <Input 
                value={qualifyForm.notes} 
                onChange={(e) => setQualifyForm({...qualifyForm, notes: e.target.value})}
                placeholder="补充说明（可选）"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQualifyDialog({ open: false, lead: null })}>取消</Button>
            <Button 
              onClick={handleQualify}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              转为机会
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 快捷跟进对话框 */}
      <QuickFollowUp
        open={quickFollowUp.open}
        onOpenChange={(open) => setQuickFollowUp(prev => ({ ...prev, open }))}
        entityType="lead"
        entityId={quickFollowUp.entityId}
        entityName={quickFollowUp.entityName}
      />
    </div>
  );
}

// Phone icon component
function Phone({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
