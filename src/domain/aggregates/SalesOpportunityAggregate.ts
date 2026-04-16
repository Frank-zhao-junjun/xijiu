// 聚合根: 商机
import { Money, Percentage, OpportunityStage } from '../value-objects';

// 机会数据（用于创建时传递）
export interface OpportunityData {
  title: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  value: Money;
  probability: Percentage;
  expectedCloseDate: string;
  description?: string;
  notes?: string;
  sourceLeadId?: string; // 来源线索ID（可选）
}

// 机会属性
export interface SalesOpportunityProps {
  id: string;
  title: string;
  customerId: string;
  customerName: string;
  contactId?: string;
  contactName?: string;
  value: Money;
  stage: OpportunityStage;
  probability: Percentage;
  expectedCloseDate: Date;
  description?: string;
  notes?: string;
  sourceLeadId?: string; // 来源线索ID
  createdAt: Date;
  updatedAt: Date;
}

// 阶段变更结果
export interface StageChangeResult {
  oldStage: OpportunityStage;
  newStage: OpportunityStage;
  isWon: boolean;
  isLost: boolean;
  reason?: string;
}

export class SalesOpportunity {
  private props: SalesOpportunityProps;

  constructor(props: SalesOpportunityProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get title(): string {
    return this.props.title;
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

  get value(): Money {
    return this.props.value;
  }

  get stage(): OpportunityStage {
    return this.props.stage;
  }

  get probability(): Percentage {
    return this.props.probability;
  }

  get expectedCloseDate(): Date {
    return this.props.expectedCloseDate;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get sourceLeadId(): string | undefined {
    return this.props.sourceLeadId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain Methods

  // 变更阶段（核心领域方法）
  changeStage(newStage: OpportunityStage, reason?: string): StageChangeResult {
    // 验证转换合法性
    if (!this.props.stage.canTransitionTo(newStage)) {
      throw new Error(
        `不能从 "${this.props.stage.getLabel()}" 阶段直接转换到 "${newStage.getLabel()}" 阶段`
      );
    }

    // 不能转换到同一阶段
    if (this.props.stage.value === newStage.value) {
      throw new Error('不能转换到相同阶段');
    }

    const oldStage = this.props.stage;
    
    // 更新阶段和概率
    this.props.stage = newStage;
    this.props.probability = Percentage.create(newStage.getDefaultProbability());
    this.props.updatedAt = new Date();

    // 记录失败原因
    if (newStage.value === 'closed_lost' && reason) {
      this.props.notes = (this.props.notes || '') + `\n失败原因: ${reason}`;
    }

    return {
      oldStage,
      newStage,
      isWon: newStage.isWon(),
      isLost: newStage.isLost(),
      reason,
    };
  }

  // 推进到需求调研阶段
  moveToDiscovery(): StageChangeResult {
    return this.changeStage(OpportunityStage.discovery());
  }

  // 推进到方案报价阶段
  moveToProposal(): StageChangeResult {
    return this.changeStage(OpportunityStage.proposal());
  }

  // 推进到商务洽谈阶段
  moveToNegotiation(): StageChangeResult {
    return this.changeStage(OpportunityStage.negotiation());
  }

  // 推进到合同签署阶段
  moveToContract(): StageChangeResult {
    return this.changeStage(OpportunityStage.contract());
  }

  // 成交
  closeWon(): StageChangeResult {
    return this.changeStage(OpportunityStage.closedWon());
  }

  // 失败
  closeLost(reason?: string): StageChangeResult {
    return this.changeStage(OpportunityStage.closedLost(), reason);
  }

  // 更新机会信息
  update(params: {
    title?: string;
    contactId?: string;
    contactName?: string;
    value?: Money;
    expectedCloseDate?: Date;
    description?: string;
    notes?: string;
  }): void {
    if (this.props.stage.isTerminal()) {
      throw new Error('已结束的机会不能修改');
    }
    if (params.title) this.props.title = params.title;
    if (params.contactId !== undefined) this.props.contactId = params.contactId;
    if (params.contactName !== undefined) this.props.contactName = params.contactName;
    if (params.value) this.props.value = params.value;
    if (params.expectedCloseDate) this.props.expectedCloseDate = params.expectedCloseDate;
    if (params.description !== undefined) this.props.description = params.description;
    if (params.notes !== undefined) this.props.notes = params.notes;
    this.props.updatedAt = new Date();
  }

  // Factory
  static create(params: {
    id: string;
    title: string;
    customerId: string;
    customerName: string;
    contactId?: string;
    contactName?: string;
    value: number;
    probability?: number;
    expectedCloseDate: string;
    description?: string;
    notes?: string;
    sourceLeadId?: string;
  }): SalesOpportunity {
    const now = new Date();
    return new SalesOpportunity({
      id: params.id,
      title: params.title,
      customerId: params.customerId,
      customerName: params.customerName,
      contactId: params.contactId,
      contactName: params.contactName,
      value: Money.create(params.value),
      stage: OpportunityStage.qualified(), // 新商机默认从商机确认开始
      probability: Percentage.create(params.probability ?? 20),
      expectedCloseDate: new Date(params.expectedCloseDate),
      description: params.description,
      notes: params.notes,
      sourceLeadId: params.sourceLeadId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 从线索Qualified后创建
  static createFromLead(params: {
    id: string;
    data: OpportunityData;
  }): SalesOpportunity {
    const now = new Date();
    return new SalesOpportunity({
      id: params.id,
      title: params.data.title,
      customerId: params.data.customerId,
      customerName: params.data.customerName,
      contactId: params.data.contactId,
      contactName: params.data.contactName,
      value: params.data.value,
      stage: OpportunityStage.qualified(),
      probability: Percentage.create(20),
      expectedCloseDate: new Date(params.data.expectedCloseDate),
      description: params.data.description,
      notes: params.data.notes,
      sourceLeadId: params.data.sourceLeadId,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Reconstitute from DB
  static reconstitute(props: SalesOpportunityProps): SalesOpportunity {
    return new SalesOpportunity(props);
  }

  toPlainObject() {
    return {
      id: this.id,
      title: this.title,
      customerId: this.customerId,
      customerName: this.customerName,
      contactId: this.contactId,
      contactName: this.contactName,
      value: this.value.amount,
      stage: this.stage.value,
      probability: this.probability.value,
      expectedCloseDate: this.expectedCloseDate.toISOString().split('T')[0],
      description: this.description,
      notes: this.notes,
      sourceLeadId: this.sourceLeadId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
