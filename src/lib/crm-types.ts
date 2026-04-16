// CRM System Types - DDD版本

// ============ 值对象类型 ============
export type CustomerStatus = 'active' | 'inactive' | 'prospect';
export type LeadStatusType = 'new' | 'contacted' | 'qualified' | 'disqualified';
export type LeadSourceType = 'referral' | 'website' | 'cold_call' | 'event' | 'advertisement' | 'other';
export type OpportunityStage = 'qualified' | 'discovery' | 'proposal' | 'negotiation' | 'contract' | 'closed_won' | 'closed_lost';

// ============ 产品管理类型 (V3.2 新增) ============
export type ProductCategory = 'software' | 'hardware' | 'service' | 'consulting' | 'other';

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: ProductCategory;
  description?: string;
  unitPrice: number;
  unit: string;
  cost: number;
  stock?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PRODUCT_CATEGORY_CONFIG: Record<ProductCategory, { label: string; color: string }> = {
  software: { label: '软件', color: 'text-blue-600' },
  hardware: { label: '硬件', color: 'text-green-600' },
  service: { label: '服务', color: 'text-purple-600' },
  consulting: { label: '咨询', color: 'text-orange-600' },
  other: { label: '其他', color: 'text-gray-600' },
};

// ============ 实体类型 ============
export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  industry: string;
  website?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  customerId: string;
  customerName: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ 销售线索类型 ============
export interface SalesLead {
  id: string;
  title: string;
  source: LeadSourceType;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  estimatedValue: number;
  probability: number;
  status: LeadStatusType;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOpportunity {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  value: number;
  stage: OpportunityStage;
  probability: number;
  expectedCloseDate: string;
  description?: string;
  notes?: string;
  sourceLeadId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ 活动记录 ============
export interface Activity {
  id: string;
  type: 'created' | 'updated' | 'deleted' | 'stage_change' | 'closed_won' | 'closed_lost' | 'qualified' | 'disqualified' | 'follow_up';
  entityType: 'customer' | 'contact' | 'lead' | 'opportunity' | 'product';
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
}

// ============ 跟进记录 ============
export type FollowUpType = 'call' | 'email' | 'meeting' | 'note';
export type FollowUpMethod = 'phone' | 'wechat' | 'email' | 'meeting' | 'other';

export const FOLLOW_UP_METHOD_CONFIG: Record<FollowUpMethod, { label: string; icon: string }> = {
  phone: { label: '电话', icon: '📞' },
  wechat: { label: '微信', icon: '💬' },
  email: { label: '邮件', icon: '📧' },
  meeting: { label: '面谈', icon: '🤝' },
  other: { label: '其他', icon: '📝' },
};

export const FOLLOW_UP_TEMPLATES = [
  '已电话联系，待发报价单',
  '发送产品资料，等待反馈',
  '现场拜访，客户有意向',
  '客户暂无需求，下季度跟进',
];

export interface FollowUp {
  id: string;
  entityType: 'customer' | 'lead' | 'opportunity';
  entityId: string;
  entityName: string;
  type: FollowUpType;
  method: FollowUpMethod;
  content: string;
  scheduledAt: string | null;
  completedAt: string | null;
  nextFollowUpAt: string | null;
  createdBy: string;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============ 通知 ============
export type NotificationType = 'overdue' | 'reminder' | 'stage_change' | 'info';

export interface CRMNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: 'lead' | 'opportunity';
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

// ============ 报价单 ============
export type QuoteStatus = 'draft' | 'active' | 'accepted' | 'rejected' | 'expired';

export interface QuoteItem {
  id: string;
  quoteId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  sortOrder: number;
}

export interface Quote {
  id: string;
  opportunityId: string;
  opportunityName?: string;
  customerId?: string;
  customerName?: string;
  title: string;
  version: number;
  revisionReason?: string;
  status: QuoteStatus;
  validFrom?: string;
  validUntil?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  terms?: string;
  notes?: string;
  items?: QuoteItem[];
  createdAt: string;
  updatedAt: string;
}

export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string; color: string }> = {
  draft: { label: '草稿', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  active: { label: '已发送', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  accepted: { label: '已接受', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  rejected: { label: '已拒绝', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400' },
  expired: { label: '已过期', className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20', color: 'text-stone-600 dark:text-stone-400' },
};

// ============ 成交订单 ============
export type OrderStatus = 'draft' | 'confirmed' | 'awaiting_payment' | 'paid' | 'completed' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  sortOrder: number;
}

export interface Order {
  id: string;
  quoteId?: string;
  quoteNumber?: string;
  opportunityId: string;
  opportunityName?: string;
  customerId: string;
  customerName?: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod?: 'bank_transfer' | 'cash' | 'credit_card' | 'other';
  orderDate?: string;
  deliveryDate?: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  notes?: string;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string; color: string; step: number }> = {
  draft: { label: '草稿', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400', step: 0 },
  confirmed: { label: '已确认', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400', step: 1 },
  awaiting_payment: { label: '待付款', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', color: 'text-orange-600 dark:text-orange-400', step: 2 },
  paid: { label: '已付款', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400', step: 3 },
  completed: { label: '已完成', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', color: 'text-emerald-600 dark:text-emerald-400', step: 4 },
  cancelled: { label: '已取消', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400', step: -1 },
};

// ============ 合同管理 ============
export type ContractStatus = 'draft' | 'executing' | 'completed' | 'terminated';

export interface ContractMilestone {
  id: string;
  contractId: string;
  name: string;
  description?: string;
  expectedDate?: string;
  completedDate?: string;
  isCompleted: boolean;
  sortOrder: number;
}

export interface Contract {
  id: string;
  contractNumber: string;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityName?: string;
  quoteId?: string;
  quoteTitle?: string;
  status: ContractStatus;
  amount: number;
  signingDate?: string;
  effectiveDate?: string;
  expirationDate?: string;
  terms?: string;
  customTerms?: string;
  milestones?: ContractMilestone[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, { label: string; className: string; color: string; step: number }> = {
  draft: { label: '草稿', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400', step: 0 },
  executing: { label: '执行中', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400', step: 1 },
  completed: { label: '已完成', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400', step: 2 },
  terminated: { label: '已终止', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400', step: -1 },
};

// ============ 今日待办 ============
export interface TodayTodo {
  todayClosing: SalesOpportunity[];
  todayFollowUps: FollowUp[];
  overdueFollowUps: FollowUp[];
}

// ============ 工作流自动化 ============
export type WorkflowTriggerType = 
  | 'lead_created' 
  | 'lead_status_changed' 
  | 'opportunity_created' 
  | 'opportunity_stage_changed' 
  | 'quote_status_changed' 
  | 'follow_up_overdue' 
  | 'opportunity_overdue';

export type WorkflowActionType = 'create_task' | 'send_notification' | 'update_field';

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in';
  value: string | string[];
}

export interface WorkflowAction {
  type: WorkflowActionType;
  config: Record<string, unknown>;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  triggerType: WorkflowTriggerType;
  triggerEntity: string;
  conditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  isTemplate: boolean;
  runCount: number;
  lastRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowLog {
  id: string;
  workflowId: string;
  workflowName: string;
  triggerType: string;
  triggerEntity?: string;
  triggerEntityId?: string;
  actionTaken: string;
  actionDetail?: string;
  result: 'success' | 'failed';
  createdAt: string;
}

// 工作流触发器配置
export const WORKFLOW_TRIGGER_CONFIG: Record<WorkflowTriggerType, { label: string; description: string; entity: string }> = {
  lead_created: { label: '线索创建', description: '当新的销售线索被创建时', entity: 'lead' },
  lead_status_changed: { label: '线索状态变更', description: '当线索状态发生变化时', entity: 'lead' },
  opportunity_created: { label: '商机创建', description: '当新的商机被创建时', entity: 'opportunity' },
  opportunity_stage_changed: { label: '商机阶段变更', description: '当商机阶段发生变化时', entity: 'opportunity' },
  quote_status_changed: { label: '报价单状态变更', description: '当报价单状态发生变化时', entity: 'quote' },
  follow_up_overdue: { label: '跟进逾期', description: '当跟进计划逾期未完成时', entity: 'follow_up' },
  opportunity_overdue: { label: '商机逾期', description: '当商机超过预计成交日期时', entity: 'opportunity' },
};

// 工作流动作配置
export const WORKFLOW_ACTION_CONFIG: Record<WorkflowActionType, { label: string; description: string }> = {
  create_task: { label: '创建任务', description: '自动创建一条待办任务' },
  send_notification: { label: '发送通知', description: '自动发送一条系统通知' },
  update_field: { label: '更新字段', description: '自动更新实体字段值' },
};

// ============ 任务管理 ============
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TaskSource = 'manual' | 'workflow';

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string; color: string; icon: string }> = {
  low: { label: '低', className: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', color: 'text-slate-600 dark:text-slate-400', icon: '↓' },
  medium: { label: '中', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400', icon: '→' },
  high: { label: '高', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', color: 'text-orange-600 dark:text-orange-400', icon: '↑' },
  urgent: { label: '紧急', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400', icon: '!!' },
};

export const TASK_STATUS_CONFIG: Record<TaskStatus, { label: string; className: string; color: string }> = {
  pending: { label: '待处理', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  in_progress: { label: '进行中', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  completed: { label: '已完成', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  cancelled: { label: '已取消', className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20', color: 'text-stone-600 dark:text-stone-400' },
};

// ============ 统计数据 ============
export interface DashboardStats {
  totalCustomers: number;
  totalContacts: number;
  totalLeads: number;
  totalOpportunities: number;
  totalRevenue: number;
  wonOpportunities: number;
  activeCustomers: number;
}

// ============ 阶段配置 ============
export const OPPORTUNITY_STAGE_CONFIG: Record<OpportunityStage, { 
  label: string; 
  className: string; 
  gradient: string; 
  color: string;
  defaultProbability: number;
  description: string;
}> = {
  qualified: { 
    label: '线索', 
    className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', 
    gradient: 'from-gray-400 to-gray-500',
    color: 'text-gray-600 dark:text-gray-400',
    defaultProbability: 10,
    description: '刚获取的销售线索'
  },
  discovery: { 
    label: '需求确认', 
    className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', 
    gradient: 'from-blue-400 to-blue-500',
    color: 'text-blue-600 dark:text-blue-400',
    defaultProbability: 25,
    description: '正在了解客户需求'
  },
  proposal: { 
    label: '方案报价', 
    className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', 
    gradient: 'from-purple-400 to-purple-500',
    color: 'text-purple-600 dark:text-purple-400',
    defaultProbability: 50,
    description: '正在提供解决方案'
  },
  negotiation: { 
    label: '商务谈判', 
    className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', 
    gradient: 'from-orange-400 to-orange-500',
    color: 'text-orange-600 dark:text-orange-400',
    defaultProbability: 75,
    description: '正在进行价格和条款谈判'
  },
  contract: { 
    label: '合同签署', 
    className: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20', 
    gradient: 'from-teal-400 to-teal-500',
    color: 'text-teal-600 dark:text-teal-400',
    defaultProbability: 90,
    description: '合同准备或签署中'
  },
  closed_won: { 
    label: '已成交', 
    className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', 
    gradient: 'from-green-400 to-green-500',
    color: 'text-green-600 dark:text-green-400',
    defaultProbability: 100,
    description: '成功签约'
  },
  closed_lost: { 
    label: '已输单', 
    className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', 
    gradient: 'from-red-400 to-red-500',
    color: 'text-red-600 dark:text-red-400',
    defaultProbability: 0,
    description: '竞争失败或客户放弃'
  },
};

// ============ 线索状态配置 ============
export const LEAD_STATUS_CONFIG: Record<LeadStatusType, { label: string; className: string; color: string }> = {
  new: { label: '新线索', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  contacted: { label: '已联系', className: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', color: 'text-purple-600 dark:text-purple-400' },
  qualified: { label: '已合格', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  disqualified: { label: '已放弃', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
};

// ============ 线索来源配置 ============
export const LEAD_SOURCE_CONFIG: Record<LeadSourceType, { label: string; icon: string }> = {
  referral: { label: '客户推荐', icon: '👥' },
  website: { label: '官网表单', icon: '🌐' },
  cold_call: { label: '电话拓展', icon: '📞' },
  event: { label: '展会活动', icon: '🎪' },
  advertisement: { label: '广告投放', icon: '📺' },
  other: { label: '其他来源', icon: '📌' },
};

// ============ 发票管理类型 (V3.3 新增) ============
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'overdue' | 'cancelled' | 'refunded';

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  sortOrder: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  orderNumber?: string;
  customerId: string;
  customerName: string;
  taxId?: string;
  billingAddress?: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate?: string;
  subtotal: number;
  taxRate: number;
  tax: number;
  total: number;
  paidDate?: string;
  paymentMethod?: 'bank_transfer' | 'cash' | 'credit_card' | 'other';
  notes?: string;
  items?: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string; color: string }> = {
  draft: { label: '草稿', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  issued: { label: '已开票', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  paid: { label: '已收款', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  overdue: { label: '逾期', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400' },
  cancelled: { label: '已作废', className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20', color: 'text-stone-600 dark:text-stone-400' },
  refunded: { label: '已退款', className: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20', color: 'text-orange-600 dark:text-orange-400' },
};

// ============ 任务管理类型 ============
// ============ 补充导出 ============
export type TaskType = 'follow_up' | 'meeting' | 'call' | 'email' | 'demo' | 'proposal' | 'other';

/** 任务（列表 / 详情 / Context 统一使用） */
export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string;
  assigneeName?: string;
  relatedType?: 'customer' | 'lead' | 'opportunity' | 'contract' | 'order';
  relatedId?: string;
  relatedName?: string;
  dueDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  entityType?: 'lead' | 'opportunity' | 'customer' | 'quote';
  entityId?: string;
  entityName?: string;
  source?: TaskSource;
  workflowId?: string;
  assignedTo?: string;
}

export const TASK_TYPE_CONFIG: Record<TaskType, { label: string; icon: string }> = {
  follow_up: { label: '跟进', icon: '📞' },
  meeting: { label: '会议', icon: '👥' },
  call: { label: '电话', icon: '📱' },
  email: { label: '邮件', icon: '✉️' },
  demo: { label: '演示', icon: '💻' },
  proposal: { label: '方案', icon: '📄' },
  other: { label: '其他', icon: '📌' },
};

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; className: string; color: string }> = {
  pending: { label: '待付款', className: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20', color: 'text-gray-600 dark:text-gray-400' },
  partial: { label: '部分付款', className: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', color: 'text-blue-600 dark:text-blue-400' },
  paid: { label: '已付款', className: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20', color: 'text-green-600 dark:text-green-400' },
  overdue: { label: '逾期', className: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', color: 'text-red-600 dark:text-red-400' },
  cancelled: { label: '已取消', className: 'bg-stone-500/10 text-stone-600 dark:text-stone-400 border-stone-500/20', color: 'text-stone-600 dark:text-stone-400' },
};

export const PAYMENT_METHOD_CONFIG: Record<string, { label: string }> = {
  bank_transfer: { label: '银行转账' },
  credit_card: { label: '信用卡' },
  cash: { label: '现金' },
  check: { label: '支票' },
  other: { label: '其他' },
};

export interface PaymentInstallment {
  id: string;
  planId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  paidAmount: number;
  status: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  title?: string;
  planNumber?: string;
  amount: number;
  totalAmount?: number;
  paidAmount?: number;
  pendingAmount?: number;
  status: PaymentStatus;
  paymentMethod?: string;
  dueDate: string;
  paidDate?: string;
  orderId?: string;
  orderName?: string;
  customerId?: string;
  customerName?: string;
  opportunityId?: string;
  opportunityName?: string;
  installments?: PaymentInstallment[];
  notes?: string;
  isOverdue?: boolean;
  overdueDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentStats {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalReceivable: number;
  totalReceived: number;
  totalOverdue: number;
  overdueCount: number;
  pendingCount: number;
  paidCount: number;
  collectionRate: number;
  overdueRate: number;
}
