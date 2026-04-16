// 聚合根: 销售线索
import { Money, Percentage, LeadStatus, LeadSource, ContactInfo } from '../value-objects';

// 线索属性
export interface SalesLeadProps {
  id: string;
  title: string;
  source: LeadSource;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  estimatedValue: Money;
  probability: Percentage;
  status: LeadStatus;
  contactInfo?: ContactInfo;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 线索转机会的数据
export interface QualifyData {
  title: string;
  value: number;
  contactId?: string;
  expectedCloseDate: string;
  notes?: string;
}

export class SalesLead {
  private props: SalesLeadProps;

  constructor(props: SalesLeadProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
  }

  get source(): LeadSource {
    return this.props.source;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get customerName(): string {
    return this.props.customerName;
  }

  get contactId(): string | undefined {
    return this.props.contactId;
  }

  get contactName(): string | undefined {
    return this.props.contactName;
  }

  get estimatedValue(): Money {
    return this.props.estimatedValue;
  }

  get probability(): Percentage {
    return this.props.probability;
  }

  get status(): LeadStatus {
    return this.props.status;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain Methods
  
  // 标记为已联系
  markContacted(): void {
    if (this.props.status.value !== 'new') {
      throw new Error('只有新建状态的线索才能标记为已联系');
    }
    this.props.status = LeadStatus.contacted();
    this.props.updatedAt = new Date();
  }

  // Qualified 转换为商机
  qualify(data: QualifyData): { opportunityData: OpportunityData } {
    if (!this.props.status.canQualify()) {
      throw new Error('当前状态不能Qualified此线索');
    }
    
    this.props.status = LeadStatus.qualified();
    this.props.updatedAt = new Date();

    return {
      opportunityData: {
        title: data.title || this.props.title,
        customerId: this.props.customerId,
        customerName: this.props.customerName,
        contactId: data.contactId || this.props.contactId,
        contactName: this.props.contactName,
        value: Money.create(data.value),
        probability: Percentage.create(30), // Qualified默认30%
        notes: data.notes || this.props.notes,
        expectedCloseDate: data.expectedCloseDate,
        sourceLeadId: this.id,
      },
    };
  }

  // 放弃线索
  disqualify(reason?: string): void {
    if (this.props.status.value === 'qualified') {
      throw new Error('已Qualified的线索不能放弃，需转为失败的机会');
    }
    this.props.status = LeadStatus.disqualified();
    if (reason) {
      this.props.notes = (this.props.notes || '') + `\n放弃原因: ${reason}`;
    }
    this.props.updatedAt = new Date();
  }

  // 更新线索信息
  update(params: {
    title?: string;
    source?: LeadSource;
    contactId?: string;
    contactName?: string;
    estimatedValue?: Money;
    notes?: string;
  }): void {
    if (this.props.status.value === 'qualified' || this.props.status.value === 'disqualified') {
      throw new Error('已Qualified或已放弃的线索不能修改');
    }
    if (params.title) this.props.title = params.title;
    if (params.source) this.props.source = params.source;
    if (params.contactId !== undefined) this.props.contactId = params.contactId;
    if (params.contactName !== undefined) this.props.contactName = params.contactName;
    if (params.estimatedValue) this.props.estimatedValue = params.estimatedValue;
    if (params.notes !== undefined) this.props.notes = params.notes;
    this.props.updatedAt = new Date();
  }

  // Factory
  static create(params: {
    id: string;
    title: string;
    source: LeadSourceType;
    customerId: string;
    customerName: string;
    contactId?: string;
    contactName?: string;
    estimatedValue: number;
    notes?: string;
  }): SalesLead {
    const now = new Date();
    return new SalesLead({
      id: params.id,
      title: params.title,
      source: LeadSource.create(params.source),
      customerId: params.customerId,
      customerName: params.customerName,
      contactId: params.contactId,
      contactName: params.contactName,
      estimatedValue: Money.create(params.estimatedValue),
      probability: Percentage.create(10), // 线索默认10%
      status: LeadStatus.new(),
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Reconstitute from DB
  static reconstitute(props: SalesLeadProps): SalesLead {
    return new SalesLead(props);
  }

  toPlainObject() {
    return {
      id: this.id,
      title: this.title,
      source: this.source.value,
      customerId: this.customerId,
      customerName: this.customerName,
      contactId: this.contactId,
      contactName: this.contactName,
      estimatedValue: this.estimatedValue.amount,
      probability: this.probability.value,
      status: this.status.value,
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}

// 需要导入的子类型
import type { LeadSourceType } from '../value-objects/LeadSource';
import type { OpportunityData } from './SalesOpportunityAggregate';
