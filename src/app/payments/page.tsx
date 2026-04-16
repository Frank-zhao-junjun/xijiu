'use client';

import { useState, useMemo } from 'react';
import { useCRM } from '@/lib/crm-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Receipt 
} from 'lucide-react';
import { PaymentPlan, PaymentStats, PAYMENT_STATUS_CONFIG } from '@/lib/crm-types';

// 统计卡片组件
function StatCard({ title, value, subtitle, icon: Icon, colorClass }: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ElementType;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-full ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 回款项组件
function PaymentRow({ payment, onRecord }: { 
  payment: PaymentPlan; 
  onRecord: () => void;
}) {
  const statusConfig = PAYMENT_STATUS_CONFIG[payment.status];
  const isOverdue = payment.isOverdue && payment.status !== 'paid' && payment.status !== 'cancelled';
  
  return (
    <div className="flex items-center justify-between p-4 border-b hover:bg-muted/50">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{payment.title}</span>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1" />
              逾期{payment.overdueDays}天
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
          <span>{payment.customerName || '-'}</span>
          <span>计划编号: {payment.planNumber}</span>
          {payment.dueDate && <span>到期日: {payment.dueDate}</span>}
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="flex items-center gap-2">
            <span className="font-semibold">¥{(payment.pendingAmount ?? 0).toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">/ ¥{(payment.totalAmount ?? 0).toLocaleString()}</span>
          </div>
          <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
            <div 
              className={`h-full ${statusConfig.color}`}
              style={{ width: `${((payment.paidAmount ?? 0) / (payment.totalAmount ?? 1)) * 100}%` }}
            />
          </div>
        </div>
        
        <Badge className={statusConfig.className}>
          {statusConfig.label}
        </Badge>
        
        <div className="flex gap-2">
          {payment.status !== 'paid' && payment.status !== 'cancelled' && (
            <Button size="sm" onClick={onRecord}>登记回款</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const { paymentPlans, customers, opportunities, addPaymentPlan, updatePaymentPlan } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showRecordDialog, setShowRecordDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentPlan | null>(null);
  const [recordAmount, setRecordAmount] = useState('');
  const [recordMethod, setRecordMethod] = useState<string>('');
  const [recordNotes, setRecordNotes] = useState('');
  
  // 新建回款计划表单
  const [newPlan, setNewPlan] = useState({
    title: '',
    customerId: '',
    customerName: '',
    opportunityId: '',
    opportunityName: '',
    totalAmount: '',
    dueDate: '',
  });

  // 计算统计数据
  const stats: PaymentStats = useMemo(() => {
    const plans = paymentPlans || [];
    const totalReceivable = plans.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0);
    const totalReceived = plans.reduce((sum, p) => sum + (p.paidAmount ?? 0), 0);
    const overduePlans = plans.filter(p => p.isOverdue && p.status !== 'paid' && p.status !== 'cancelled');
    const totalOverdue = overduePlans.reduce((sum, p) => sum + (p.pendingAmount ?? 0), 0);
    
    return {
      totalAmount: totalReceivable,
      paidAmount: totalReceived,
      pendingAmount: totalReceivable - totalReceived,
      overdueAmount: totalOverdue,
      totalReceivable,
      totalReceived,
      totalOverdue,
      overdueCount: overduePlans.length,
      pendingCount: plans.filter(p => p.status === 'pending' || p.status === 'partial').length,
      paidCount: plans.filter(p => p.status === 'paid').length,
      collectionRate: totalReceivable > 0 ? (totalReceived / totalReceivable) * 100 : 0,
      overdueRate: totalReceivable > 0 ? (totalOverdue / totalReceivable) * 100 : 0,
    };
  }, [paymentPlans]);

  // 筛选回款计划
  const filteredPayments = useMemo(() => {
    let plans = paymentPlans || [];
    
    // 按标签筛选
    if (activeTab === 'overdue') {
      plans = plans.filter(p => p.isOverdue && p.status !== 'paid' && p.status !== 'cancelled');
    } else if (activeTab === 'pending') {
      plans = plans.filter(p => p.status === 'pending' || p.status === 'partial');
    } else if (activeTab === 'paid') {
      plans = plans.filter(p => p.status === 'paid');
    }
    
    // 按状态筛选
    if (statusFilter !== 'all') {
      plans = plans.filter(p => p.status === statusFilter);
    }
    
    // 按搜索词筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      plans = plans.filter(p => 
        (p.title || '').toLowerCase().includes(term) ||
        p.customerName?.toLowerCase().includes(term) ||
        (p.planNumber || '').toLowerCase().includes(term)
      );
    }
    
    return plans.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [paymentPlans, activeTab, statusFilter, searchTerm]);

  // 创建新回款计划
  const handleCreatePlan = () => {
    if (!newPlan.title || !newPlan.totalAmount || !newPlan.dueDate) {
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const dueDate = newPlan.dueDate;
    
    const plan: Omit<PaymentPlan, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newPlan.title,
      amount: parseFloat(newPlan.totalAmount),
      planNumber: `PP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String((paymentPlans?.length || 0) + 1).padStart(4, '0')}`,
      title: newPlan.title,
      customerId: newPlan.customerId || undefined,
      customerName: newPlan.customerName || customers.find(c => c.id === newPlan.customerId)?.name,
      opportunityId: newPlan.opportunityId || undefined,
      opportunityName: newPlan.opportunityName || opportunities.find(o => o.id === newPlan.opportunityId)?.title,
      totalAmount: parseFloat(newPlan.totalAmount),
      paidAmount: 0,
      pendingAmount: parseFloat(newPlan.totalAmount),
      dueDate: newPlan.dueDate,
      status: 'pending',
      installments: [{
        id: `inst-${Date.now()}`,
        planId: `payment-${Date.now()}`,
        installmentNumber: 1,
        amount: parseFloat(newPlan.totalAmount),
        dueDate: newPlan.dueDate,
        paidAmount: 0,
        status: 'pending',
      }],
      overdueDays: dueDate < today ? Math.ceil((new Date(today).getTime() - new Date(dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      isOverdue: dueDate < today,
    };
    
    addPaymentPlan(plan);
    setShowAddDialog(false);
    setNewPlan({
      title: '',
      customerId: '',
      customerName: '',
      opportunityId: '',
      opportunityName: '',
      totalAmount: '',
      dueDate: '',
    });
  };

  // 登记回款
  const handleRecordPayment = () => {
    if (!selectedPayment || !recordAmount) return;
    
    const amount = parseFloat(recordAmount);
    const newPaidAmount = (selectedPayment.paidAmount ?? 0) + amount;
    const newPendingAmount = (selectedPayment.totalAmount ?? 0) - newPaidAmount;
    
    updatePaymentPlan(selectedPayment.id, {
      paidAmount: newPaidAmount,
      pendingAmount: Math.max(0, newPendingAmount),
      status: newPaidAmount >= (selectedPayment.totalAmount ?? 0) ? 'paid' : 'partial',
      paymentMethod: recordMethod,
    });
    
    setShowRecordDialog(false);
    setSelectedPayment(null);
    setRecordAmount('');
    setRecordMethod('');
    setRecordNotes('');
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-8 w-8" />
            回款管理
          </h1>
          <p className="text-muted-foreground mt-1">管理应收款项，跟踪回款进度</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新建回款计划
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="应收总额"
          value={`¥${stats.totalReceivable.toLocaleString()}`}
          icon={DollarSign}
          colorClass="bg-blue-100 text-blue-600"
        />
        <StatCard
          title="已收金额"
          value={`¥${stats.totalReceived.toLocaleString()}`}
          subtitle={`回款率 ${stats.collectionRate.toFixed(1)}%`}
          icon={CheckCircle}
          colorClass="bg-green-100 text-green-600"
        />
        <StatCard
          title="逾期金额"
          value={`¥${stats.totalOverdue.toLocaleString()}`}
          subtitle={`${stats.overdueCount} 笔逾期`}
          icon={AlertTriangle}
          colorClass="bg-red-100 text-red-600"
        />
        <StatCard
          title="待收款"
          value={`¥${(stats.totalReceivable - stats.totalReceived).toLocaleString()}`}
          subtitle={`${stats.pendingCount} 笔待收`}
          icon={Clock}
          colorClass="bg-orange-100 text-orange-600"
        />
      </div>

      {/* 筛选和标签 */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索回款计划..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="pending">待收款</SelectItem>
            <SelectItem value="partial">部分回款</SelectItem>
            <SelectItem value="overdue">已逾期</SelectItem>
            <SelectItem value="paid">已结清</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="overdue" className="text-red-600">
            <AlertTriangle className="h-4 w-4 mr-1" />
            逾期 ({stats.overdueCount})
          </TabsTrigger>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-1" />
            待收款 ({stats.pendingCount})
          </TabsTrigger>
          <TabsTrigger value="paid">
            <CheckCircle className="h-4 w-4 mr-1" />
            已结清 ({stats.paidCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>回款计划列表</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredPayments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无回款计划</p>
                  <Button variant="link" onClick={() => setShowAddDialog(true)}>
                    创建第一个回款计划
                  </Button>
                </div>
              ) : (
                filteredPayments.map(payment => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    onRecord={() => {
                      setSelectedPayment(payment);
                      setShowRecordDialog(true);
                    }}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 新建回款计划对话框 */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新建回款计划</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>计划名称 *</Label>
              <Input
                value={newPlan.title}
                onChange={(e) => setNewPlan({ ...newPlan, title: e.target.value })}
                placeholder="例如：XX项目首付款"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>关联客户</Label>
                <Select value={newPlan.customerId} onValueChange={(v) => setNewPlan({ ...newPlan, customerId: v, customerName: customers.find(c => c.id === v)?.name || '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择客户" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>关联商机</Label>
                <Select value={newPlan.opportunityId} onValueChange={(v) => setNewPlan({ ...newPlan, opportunityId: v, opportunityName: opportunities.find(o => o.id === v)?.title || '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择商机" />
                  </SelectTrigger>
                  <SelectContent>
                    {opportunities.map(o => (
                      <SelectItem key={o.id} value={o.id}>{o.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>回款金额 *</Label>
                <Input
                  type="number"
                  value={newPlan.totalAmount}
                  onChange={(e) => setNewPlan({ ...newPlan, totalAmount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <Label>到期日期 *</Label>
                <Input
                  type="date"
                  value={newPlan.dueDate}
                  onChange={(e) => setNewPlan({ ...newPlan, dueDate: e.target.value })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>取消</Button>
            <Button onClick={handleCreatePlan}>创建计划</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 登记回款对话框 */}
      <Dialog open={showRecordDialog} onOpenChange={setShowRecordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>登记回款</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <p className="font-medium">{selectedPayment.title}</p>
                <p className="text-sm text-muted-foreground">
                  待收金额: ¥{(selectedPayment.pendingAmount ?? 0).toLocaleString()}
                </p>
              </div>
              
              <div>
                <Label>回款金额 *</Label>
                <Input
                  type="number"
                  value={recordAmount}
                  onChange={(e) => setRecordAmount(e.target.value)}
                  placeholder="请输入回款金额"
                  max={selectedPayment.pendingAmount ?? 0}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  最大可登记金额: ¥{(selectedPayment.pendingAmount ?? 0).toLocaleString()}
                </p>
              </div>
              
              <div>
                <Label>收款方式</Label>
                <Select value={recordMethod} onValueChange={setRecordMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择收款方式" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">🏦 银行转账</SelectItem>
                    <SelectItem value="cash">💵 现金</SelectItem>
                    <SelectItem value="credit_card">💳 信用卡</SelectItem>
                    <SelectItem value="check">📝 支票</SelectItem>
                    <SelectItem value="other">💰 其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>备注</Label>
                <Textarea
                  value={recordNotes}
                  onChange={(e) => setRecordNotes(e.target.value)}
                  placeholder="添加备注信息..."
                  rows={2}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRecordDialog(false)}>取消</Button>
            <Button onClick={handleRecordPayment}>确认登记</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
