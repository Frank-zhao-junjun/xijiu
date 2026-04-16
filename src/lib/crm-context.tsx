'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Customer, Contact, SalesOpportunity, DashboardStats, Activity, OpportunityStage, SalesLead, Product, PaymentPlan, Task } from './crm-types';

interface CRMContextType {
  customers: Customer[];
  contacts: Contact[];
  opportunities: SalesOpportunity[];
  leads: SalesLead[];  // 销售线索
  products: Product[]; // 产品管理
  paymentPlans: PaymentPlan[]; // 回款计划
  todayPayments: PaymentPlan[]; // 今日到期回款
  overduePayments: PaymentPlan[]; // 逾期回款
  tasks: Task[]; // 任务管理
  overdueTasks: Task[]; // 逾期任务
  activities: Activity[];
  stats: DashboardStats;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  
  // Customer operations
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCustomer: (id: string, customer: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  
  // Contact operations
  addContact: (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateContact: (id: string, contact: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;
  
  // Lead operations (销售线索)
  addLead: (lead: Omit<SalesLead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLead: (id: string, lead: Partial<SalesLead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  qualifyLead: (leadId: string, opportunityData: { 
    opportunityTitle: string;
    value: number;
    contactId?: string;
    contactName?: string;
    expectedCloseDate: string;
    notes?: string;
  }) => Promise<void>;
  disqualifyLead: (leadId: string, reason?: string) => Promise<void>;
  
  // Product operations (产品管理)
  createProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  toggleProductActive: (id: string) => Promise<void>;
  
  // Payment Plan operations (回款管理 V3.3 新增)
  addPaymentPlan: (plan: Omit<PaymentPlan, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePaymentPlan: (id: string, plan: Partial<PaymentPlan>) => Promise<void>;
  deletePaymentPlan: (id: string) => Promise<void>;
  recordPayment: (planId: string, amount: number, method?: string) => Promise<void>;
  
  // Opportunity operations (商机)
  addOpportunity: (opportunity: Omit<SalesOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateOpportunity: (id: string, opportunity: Partial<SalesOpportunity>) => Promise<void>;
  deleteOpportunity: (id: string) => Promise<void>;
  changeOpportunityStage: (id: string, newStage: OpportunityStage, reason?: string) => Promise<void>;
  
  // Task operations (任务管理 V4.1 新增)
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
}

// API helper functions
async function apiGet<T>(type: string, params?: Record<string, string>): Promise<T> {
  const url = new URL('/api/crm', window.location.origin);
  url.searchParams.set('type', type);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

async function apiPost<T>(action: string, data: unknown): Promise<T> {
  const response = await fetch('/api/crm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

async function apiPut<T>(action: string, id: string, data: unknown): Promise<T> {
  const response = await fetch('/api/crm', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, id, data }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  return response.json();
}

async function apiDelete(action: string, id: string): Promise<void> {
  const url = new URL('/api/crm', window.location.origin);
  url.searchParams.set('action', action);
  url.searchParams.set('id', id);
  const response = await fetch(url.toString(), { method: 'DELETE' });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
}

// Initial sample data
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_1',
    name: '北京科技有限公司',
    email: 'contact@bjkj.com',
    phone: '010-88888888',
    company: '北京科技有限公司',
    status: 'active',
    industry: '科技',
    website: 'https://bjkj.com',
    address: '北京市朝阳区科技园区',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z',
  },
  {
    id: 'cust_2',
    name: '上海贸易集团',
    email: 'info@shmy.com',
    phone: '021-66666666',
    company: '上海贸易集团',
    status: 'active',
    industry: '贸易',
    website: 'https://shmy.com',
    address: '上海市浦东新区陆家嘴',
    createdAt: '2024-02-20T09:00:00Z',
    updatedAt: '2024-02-20T09:00:00Z',
  },
  {
    id: 'cust_3',
    name: '深圳创新科技',
    email: 'hello@szcx.com',
    phone: '0755-88888888',
    company: '深圳创新科技',
    status: 'active',
    industry: '科技',
    website: 'https://szcx.com',
    address: '深圳市南山区科技园',
    createdAt: '2024-03-10T10:00:00Z',
    updatedAt: '2024-03-10T10:00:00Z',
  },
];

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cont_1',
    firstName: '张',
    lastName: '伟',
    email: 'zhangwei@bjkj.com',
    phone: '13800138001',
    position: '技术总监',
    customerId: 'cust_1',
    customerName: '北京科技有限公司',
    isPrimary: true,
    createdAt: '2024-01-15T08:30:00Z',
    updatedAt: '2024-01-15T08:30:00Z',
  },
  {
    id: 'cont_2',
    firstName: '李',
    lastName: '娜',
    email: 'lina@shmy.com',
    phone: '13900139002',
    position: '采购经理',
    customerId: 'cust_2',
    customerName: '上海贸易集团',
    isPrimary: true,
    createdAt: '2024-02-20T09:30:00Z',
    updatedAt: '2024-02-20T09:30:00Z',
  },
  {
    id: 'cont_3',
    firstName: '王',
    lastName: '强',
    email: 'wangqiang@szcx.com',
    phone: '13700137003',
    position: 'CEO',
    customerId: 'cust_3',
    customerName: '深圳创新科技',
    isPrimary: true,
    createdAt: '2024-03-10T10:30:00Z',
    updatedAt: '2024-03-10T10:30:00Z',
  },
];

const INITIAL_OPPORTUNITIES: SalesOpportunity[] = [
  {
    id: 'opp_1',
    title: '企业CRM系统采购项目',
    customerId: 'cust_1',
    customerName: '北京科技有限公司',
    contactId: 'cont_1',
    contactName: '张伟',
    value: 150000,
    stage: 'proposal',
    probability: 50,
    expectedCloseDate: '2024-06-30',
    description: '北京科技计划采购一套完整的企业CRM系统，包含客户管理、销售自动化和数据分析模块',
    createdAt: '2024-04-01T10:00:00Z',
    updatedAt: '2024-04-15T14:00:00Z',
  },
  {
    id: 'opp_2',
    title: '供应链管理系统实施',
    customerId: 'cust_2',
    customerName: '上海贸易集团',
    contactId: 'cont_2',
    contactName: '李娜',
    value: 280000,
    stage: 'negotiation',
    probability: 75,
    expectedCloseDate: '2024-05-15',
    description: '上海贸易集团的供应链管理系统升级项目，涉及采购、库存和物流模块',
    createdAt: '2024-03-15T11:00:00Z',
    updatedAt: '2024-04-20T16:00:00Z',
  },
  {
    id: 'opp_3',
    title: '智能营销平台搭建',
    customerId: 'cust_3',
    customerName: '深圳创新科技',
    contactId: 'cont_3',
    contactName: '王强',
    value: 200000,
    stage: 'discovery',
    probability: 25,
    expectedCloseDate: '2024-07-31',
    description: '深圳创新科技需要建设一套智能营销平台，整合多渠道获客和精准营销能力',
    createdAt: '2024-04-10T09:00:00Z',
    updatedAt: '2024-04-10T09:00:00Z',
  },
  {
    id: 'opp_4',
    title: '数据中台建设项目',
    customerId: 'cust_1',
    customerName: '北京科技有限公司',
    contactId: 'cont_1',
    contactName: '张伟',
    value: 350000,
    stage: 'qualified',
    probability: 10,
    expectedCloseDate: '2024-09-30',
    description: '数据中台整体规划与建设',
    createdAt: '2024-04-18T08:00:00Z',
    updatedAt: '2024-04-18T08:00:00Z',
  },
  {
    id: 'opp_5',
    title: '客服系统升级项目',
    customerId: 'cust_2',
    customerName: '上海贸易集团',
    contactId: 'cont_2',
    contactName: '李娜',
    value: 80000,
    stage: 'closed_won',
    probability: 100,
    expectedCloseDate: '2024-04-01',
    description: '客服系统升级，支持多渠道接入',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-04-01T17:00:00Z',
  },
];

const INITIAL_LEADS: SalesLead[] = [
  {
    id: 'lead_1',
    title: '广州制造业客户',
    source: 'website',
    customerId: '',
    customerName: '广州智造科技',
    estimatedValue: 120000,
    probability: 20,
    status: 'new',
    notes: '官网表单留资，对制造业CRM感兴趣',
    createdAt: '2024-04-19T10:00:00Z',
    updatedAt: '2024-04-19T10:00:00Z',
  },
  {
    id: 'lead_2',
    title: '成都软件公司',
    source: 'referral',
    customerId: '',
    customerName: '成都云软件',
    estimatedValue: 200000,
    probability: 40,
    status: 'contacted',
    notes: '老客户推荐，有CRM采购意向',
    createdAt: '2024-04-18T14:00:00Z',
    updatedAt: '2024-04-19T09:00:00Z',
  },
  {
    id: 'lead_3',
    title: '杭州电商企业',
    source: 'event',
    customerId: '',
    customerName: '杭州电商云',
    estimatedValue: 180000,
    probability: 30,
    status: 'qualified',
    notes: '展会获取名片，已确认需求',
    createdAt: '2024-04-15T16:00:00Z',
    updatedAt: '2024-04-20T11:00:00Z',
  },
];

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act_1',
    type: 'created',
    entityType: 'opportunity',
    entityId: 'opp_1',
    entityName: '企业CRM系统采购项目',
    description: '创建销售商机',
    timestamp: '2024-04-01T10:00:00Z',
  },
  {
    id: 'act_2',
    type: 'stage_change',
    entityType: 'opportunity',
    entityId: 'opp_2',
    entityName: '供应链管理系统实施',
    description: '阶段变更: 需求确认 → 方案报价',
    timestamp: '2024-04-20T16:00:00Z',
  },
  {
    id: 'act_3',
    type: 'closed_won',
    entityType: 'opportunity',
    entityId: 'opp_5',
    entityName: '客服系统升级项目',
    description: '商机成交！',
    timestamp: '2024-04-01T17:00:00Z',
  },
];

// Initial products (V3.2 新增)
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    name: 'CRM标准版',
    sku: 'SW-CRM-STD',
    category: 'software',
    description: '包含客户管理、销售自动化、报表分析等核心功能',
    unitPrice: 29999,
    unit: '套/年',
    cost: 15000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod_2',
    name: 'CRM专业版',
    sku: 'SW-CRM-PRO',
    category: 'software',
    description: '包含标准版全部功能及营销自动化、高级分析等进阶功能',
    unitPrice: 59999,
    unit: '套/年',
    cost: 30000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod_3',
    name: '实施服务',
    sku: 'SV-IMP-001',
    category: 'service',
    description: '标准实施服务，包含系统部署、数据迁移、培训等',
    unitPrice: 15000,
    unit: '人天',
    cost: 8000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod_4',
    name: '定制开发服务',
    sku: 'SV-CUS-001',
    category: 'consulting',
    description: '按需定制开发服务，个性化功能扩展',
    unitPrice: 2000,
    unit: '人天',
    cost: 1000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'prod_5',
    name: '智能客服机器人',
    sku: 'SW-AI-BOT',
    category: 'software',
    description: '基于大模型的智能客服系统，支持多轮对话和知识库',
    unitPrice: 39999,
    unit: '套/年',
    cost: 20000,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const CRMContext = createContext<CRMContextType | null>(null);

export function CRMProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]); // 任务管理 V4.1
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 逾期任务计算
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'completed' || t.status === 'cancelled') return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  // 今日到期回款
  const todayPayments = paymentPlans.filter(p => {
    if (p.status === 'paid' || p.status === 'cancelled') return false;
    const dueDate = new Date(p.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });

  // 逾期回款
  const overduePayments = paymentPlans.filter(p => {
    if (p.status === 'paid' || p.status === 'cancelled') return false;
    const dueDate = new Date(p.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const stats: DashboardStats = {
    totalCustomers: customers.length,
    totalContacts: contacts.length,
    totalLeads: leads.length,
    totalOpportunities: opportunities.filter(o => o.stage !== 'closed_won' && o.stage !== 'closed_lost').length,
    totalRevenue: opportunities
      .filter(o => o.stage === 'closed_won')
      .reduce((sum, o) => sum + o.value, 0),
    wonOpportunities: opportunities.filter(o => o.stage === 'closed_won').length,
    activeCustomers: customers.filter(c => c.status === 'active').length,
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dbCustomers, dbContacts, dbOpportunities, dbLeads, dbActivities, dbProducts, dbTasks] = await Promise.all([
        apiGet<Customer[]>('customers').catch(() => INITIAL_CUSTOMERS),
        apiGet<Contact[]>('contacts').catch(() => INITIAL_CONTACTS),
        apiGet<SalesOpportunity[]>('opportunities').catch(() => INITIAL_OPPORTUNITIES),
        apiGet<SalesLead[]>('leads').catch(() => INITIAL_LEADS),
        apiGet<Activity[]>('activities').catch(() => INITIAL_ACTIVITIES),
        apiGet<Product[]>('products').catch(() => INITIAL_PRODUCTS),
        apiGet<Task[]>('tasks').catch(() => []),
      ]);
      
      setCustomers(dbCustomers);
      setContacts(dbContacts);
      setOpportunities(dbOpportunities);
      setLeads(dbLeads);
      setActivities(dbActivities);
      setProducts(dbProducts);
      setTasks(dbTasks);
    } catch (err) {
      console.error('Failed to load CRM data:', err);
      // Use initial data as fallback
      setCustomers(INITIAL_CUSTOMERS);
      setContacts(INITIAL_CONTACTS);
      setOpportunities(INITIAL_OPPORTUNITIES);
      setLeads(INITIAL_LEADS);
      setActivities(INITIAL_ACTIVITIES);
      setProducts(INITIAL_PRODUCTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addActivity = useCallback((
    type: Activity['type'],
    entityType: Activity['entityType'],
    entityId: string,
    entityName: string,
    description: string
  ) => {
    const newActivity: Activity = {
      id: generateId(),
      type,
      entityType,
      entityId,
      entityName,
      description,
      timestamp: new Date().toISOString(),
    };
    setActivities(prev => [newActivity, ...prev]);
  }, []);

  // Customer operations
  const addCustomer = useCallback(async (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addCustomer', newCustomer);
    setCustomers(prev => [...prev, newCustomer]);
    addActivity('created', 'customer', newCustomer.id, newCustomer.name, `创建客户 "${newCustomer.name}"`);
  }, [addActivity]);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateCustomer', id, updated);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    const customer = customers.find(c => c.id === id);
    if (customer) {
      addActivity('updated', 'customer', id, customer.name, `更新客户 ${customer.name}`);
    }
  }, [customers, addActivity]);

  const deleteCustomer = useCallback(async (id: string) => {
    await apiDelete('deleteCustomer', id);
    const customer = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (customer) {
      addActivity('deleted', 'customer', id, customer.name, `删除客户 ${customer.name}`);
    }
  }, [customers, addActivity]);

  // Contact operations
  const addContact = useCallback(async (contact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newContact: Contact = {
      ...contact,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addContact', newContact);
    setContacts(prev => [...prev, newContact]);
  }, []);

  const updateContact = useCallback(async (id: string, updates: Partial<Contact>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateContact', id, updated);
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    await apiDelete('deleteContact', id);
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  // Lead operations
  const addLead = useCallback(async (lead: Omit<SalesLead, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newLead: SalesLead = {
      ...lead,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addLead', newLead);
    setLeads(prev => [...prev, newLead]);
    addActivity('created', 'lead', newLead.id, newLead.title, `创建销售线索 "${newLead.title}"`);
  }, [addActivity]);

  const updateLead = useCallback(async (id: string, updates: Partial<SalesLead>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateLead', id, updated);
    setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    const lead = leads.find(l => l.id === id);
    if (lead) {
      addActivity('updated', 'lead', id, lead.title, `更新销售线索 ${lead.title}`);
    }
  }, [leads, addActivity]);

  const deleteLead = useCallback(async (id: string) => {
    await apiDelete('deleteLead', id);
    const lead = leads.find(l => l.id === id);
    setLeads(prev => prev.filter(l => l.id !== id));
    if (lead) {
      addActivity('deleted', 'lead', id, lead.title, `删除销售线索 ${lead.title}`);
    }
  }, [leads, addActivity]);

  const qualifyLead = useCallback(async (leadId: string, opportunityData: {
    opportunityTitle: string;
    value: number;
    contactId?: string;
    contactName?: string;
    expectedCloseDate: string;
    notes?: string;
  }) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) return;

    const newOpportunity: SalesOpportunity = {
      id: generateId(),
      title: opportunityData.opportunityTitle,
      customerId: lead.customerId,
      customerName: lead.customerName,
      contactId: opportunityData.contactId,
      contactName: opportunityData.contactName,
      value: opportunityData.value,
      stage: 'qualified',
      probability: 10,
      expectedCloseDate: opportunityData.expectedCloseDate,
      description: opportunityData.notes,
      sourceLeadId: leadId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await apiPost('addOpportunity', newOpportunity);
    setOpportunities(prev => [...prev, newOpportunity]);
    
    await updateLead(leadId, { status: 'qualified' });
    addActivity('qualified', 'opportunity', newOpportunity.id, newOpportunity.title, `线索 "${lead.title}" 已转化为商机`);
  }, [leads, updateLead, addActivity]);

  const disqualifyLead = useCallback(async (leadId: string, reason?: string) => {
    const lead = leads.find(l => l.id === leadId);
    await updateLead(leadId, { status: 'disqualified', notes: reason || lead?.notes });
    if (lead) {
      addActivity('disqualified', 'lead', leadId, lead.title, `销售线索 "${lead.title}" 已标记为无效`);
    }
  }, [leads, updateLead, addActivity]);

  // Product operations (V3.2 新增)
  const createProduct = useCallback(async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProduct: Product = {
      ...product,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addProduct', newProduct);
    setProducts(prev => [...prev, newProduct]);
    addActivity('created', 'product', newProduct.id, newProduct.name, `创建产品 "${newProduct.name}"`);
  }, [addActivity]);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateProduct', id, updated);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    const product = products.find(p => p.id === id);
    if (product) {
      addActivity('updated', 'product', id, product.name, `更新产品 ${product.name}`);
    }
  }, [products, addActivity]);

  const deleteProduct = useCallback(async (id: string) => {
    await apiDelete('deleteProduct', id);
    const product = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
    if (product) {
      addActivity('deleted', 'product', id, product.name, `删除产品 ${product.name}`);
    }
  }, [products, addActivity]);

  const toggleProductActive = useCallback(async (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      await updateProduct(id, { isActive: !product.isActive });
    }
  }, [products, updateProduct]);

  // Payment Plan operations (V3.3 新增)
  const addPaymentPlan = useCallback(async (plan: Omit<PaymentPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newPlan: PaymentPlan = {
      ...plan,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addPaymentPlan', newPlan);
    setPaymentPlans(prev => [...prev, newPlan]);
    const planLabel = newPlan.title ?? newPlan.name;
    addActivity('created', 'lead', newPlan.id, planLabel, `创建回款计划 "${planLabel}"`);
  }, [addActivity]);

  const updatePaymentPlan = useCallback(async (id: string, updates: Partial<PaymentPlan>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updatePaymentPlan', id, updated);
    setPaymentPlans(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    const plan = paymentPlans.find(p => p.id === id);
    if (plan) {
      const planLabel = plan.title ?? plan.name;
      addActivity('updated', 'lead', id, planLabel, `更新回款计划 ${planLabel}`);
    }
  }, [paymentPlans, addActivity]);

  const deletePaymentPlan = useCallback(async (id: string) => {
    await apiDelete('deletePaymentPlan', id);
    const plan = paymentPlans.find(p => p.id === id);
    setPaymentPlans(prev => prev.filter(p => p.id !== id));
    if (plan) {
      const planLabel = plan.title ?? plan.name;
      addActivity('deleted', 'lead', id, planLabel, `删除回款计划 ${planLabel}`);
    }
  }, [paymentPlans, addActivity]);

  const recordPayment = useCallback(async (planId: string, amount: number, method?: string) => {
    const plan = paymentPlans.find(p => p.id === planId);
    if (!plan) return;
    
    const paid = plan.paidAmount ?? 0;
    const total = plan.totalAmount ?? plan.amount;
    const newPaidAmount = paid + amount;
    const newPendingAmount = Math.max(0, total - newPaidAmount);
    const planLabel = plan.title ?? plan.name;

    await updatePaymentPlan(planId, {
      paidAmount: newPaidAmount,
      pendingAmount: newPendingAmount,
      status: newPaidAmount >= total ? 'paid' : 'partial',
      paymentMethod: method,
    });

    addActivity('updated', 'lead', planId, planLabel, `登记回款 ¥${amount.toLocaleString()}`);
  }, [paymentPlans, updatePaymentPlan, addActivity]);

  // Task operations (V4.1 新增)
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addTask', newTask);
    setTasks(prev => [...prev, newTask]);
    addActivity('created', 'lead', newTask.id, newTask.title, `创建任务 "${newTask.title}"`);
  }, [addActivity]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateTask', id, updated);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    const task = tasks.find(t => t.id === id);
    if (task) {
      addActivity('updated', 'lead', id, task.title, `更新任务 ${task.title}`);
    }
  }, [tasks, addActivity]);

  const deleteTask = useCallback(async (id: string) => {
    await apiDelete('deleteTask', id);
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.filter(t => t.id !== id));
    if (task) {
      addActivity('deleted', 'lead', id, task.title, `删除任务 ${task.title}`);
    }
  }, [tasks, addActivity]);

  const completeTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    const updated = {
      status: 'completed' as const,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPut('updateTask', id, updated);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    addActivity('updated', 'lead', id, task.title, `完成任务 "${task.title}"`);
  }, [tasks, addActivity]);

  // Opportunity operations
  const addOpportunity = useCallback(async (opportunity: Omit<SalesOpportunity, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newOpportunity: SalesOpportunity = {
      ...opportunity,
      id: generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await apiPost('addOpportunity', newOpportunity);
    setOpportunities(prev => [...prev, newOpportunity]);
    addActivity('created', 'opportunity', newOpportunity.id, newOpportunity.title, `创建销售商机 "${newOpportunity.title}"`);
  }, [addActivity]);

  const updateOpportunity = useCallback(async (id: string, updates: Partial<SalesOpportunity>) => {
    const updated = { ...updates, updatedAt: new Date().toISOString() };
    await apiPut('updateOpportunity', id, updated);
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, ...updated } : o));
    const opportunity = opportunities.find(o => o.id === id);
    if (opportunity) {
      addActivity('updated', 'opportunity', id, opportunity.title, `更新销售商机 ${opportunity.title}`);
    }
  }, [opportunities, addActivity]);

  const deleteOpportunity = useCallback(async (id: string) => {
    await apiDelete('deleteOpportunity', id);
    const opportunity = opportunities.find(o => o.id === id);
    setOpportunities(prev => prev.filter(o => o.id !== id));
    if (opportunity) {
      addActivity('deleted', 'opportunity', id, opportunity.title, `删除销售商机 ${opportunity.title}`);
    }
  }, [opportunities, addActivity]);

  const changeOpportunityStage = useCallback(async (id: string, newStage: OpportunityStage, reason?: string) => {
    const opportunity = opportunities.find(o => o.id === id);
    if (!opportunity) return;

    const stageConfig = {
      qualified: '线索',
      discovery: '需求确认',
      proposal: '方案报价',
      negotiation: '商务谈判',
      contract: '合同签署',
      closed_won: '已成交',
      closed_lost: '已输单',
    };

    const oldStage = opportunity.stage;
    const probabilityMap: Record<OpportunityStage, number> = {
      qualified: 10,
      discovery: 25,
      proposal: 50,
      negotiation: 75,
      contract: 90,
      closed_won: 100,
      closed_lost: 0,
    };

    await updateOpportunity(id, { 
      stage: newStage, 
      probability: probabilityMap[newStage],
      notes: reason || opportunity.notes 
    });

    const activityType = newStage === 'closed_won' ? 'closed_won' : newStage === 'closed_lost' ? 'closed_lost' : 'stage_change';
    const description = activityType === 'closed_won' 
      ? `商机成交！金额：¥${opportunity.value.toLocaleString()}`
      : activityType === 'closed_lost'
      ? `商机输单${reason ? `，原因：${reason}` : ''}`
      : `阶段变更: ${stageConfig[oldStage]} → ${stageConfig[newStage]}`;

    addActivity(activityType, 'opportunity', id, opportunity.title, description);
  }, [opportunities, updateOpportunity, addActivity]);

  const value: CRMContextType = {
    customers,
    contacts,
    opportunities,
    leads,
    products,
    paymentPlans,
    todayPayments,
    overduePayments,
    tasks,
    overdueTasks,
    activities,
    stats,
    loading,
    error,
    refreshData: loadData,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addContact,
    updateContact,
    deleteContact,
    addLead,
    updateLead,
    deleteLead,
    qualifyLead,
    disqualifyLead,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductActive,
    addPaymentPlan,
    updatePaymentPlan,
    deletePaymentPlan,
    recordPayment,
    addOpportunity,
    updateOpportunity,
    deleteOpportunity,
    changeOpportunityStage,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
  };

  return (
    <CRMContext.Provider value={value}>
      {children}
    </CRMContext.Provider>
  );
}

export function useCRM() {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
}
