// 领域服务: 销售领域服务
import { 
  SalesLead, 
  SalesOpportunity, 
  QualifyData,
  StageChangeResult 
} from '../aggregates';
import { OpportunityStage, type OpportunityStageType, LeadSourceType } from '../value-objects';
import {
  LeadCreatedEvent,
  LeadQualifiedEvent,
  LeadDisqualifiedEvent,
  OpportunityCreatedEvent,
  OpportunityStageChangedEvent,
  OpportunityClosedWonEvent,
  OpportunityClosedLostEvent,
} from '../events';

// 事件总线接口
export interface EventBus {
  publish<T>(event: T): void;
}

// 活动记录接口
export interface ActivityRecorder {
  log(params: {
    type: string;
    entityType: string;
    entityId: string;
    entityName: string;
    description: string;
  }): Promise<void>;
}

// 销售领域服务
export class SalesDomainService {
  constructor(
    private eventBus: EventBus,
    private activityRecorder: ActivityRecorder
  ) {}

  // 创建销售线索
  async createLead(params: {
    id: string;
    title: string;
    source: string;
    customerId: string;
    customerName: string;
    contactId?: string;
    contactName?: string;
    estimatedValue: number;
    notes?: string;
  }): Promise<SalesLead> {
    // 1. 创建线索实体
    const lead = SalesLead.create({
      id: params.id,
      title: params.title,
      source: params.source as LeadSourceType,
      customerId: params.customerId,
      customerName: params.customerName,
      contactId: params.contactId,
      contactName: params.contactName,
      estimatedValue: params.estimatedValue,
      notes: params.notes,
    });

    // 2. 发布领域事件
    this.eventBus.publish(new LeadCreatedEvent({
      leadId: lead.id,
      title: lead.title,
      customerId: lead.customerId,
      customerName: lead.customerName,
      estimatedValue: lead.estimatedValue.amount,
      source: lead.source.value,
    }));

    // 3. 记录活动
    await this.activityRecorder.log({
      type: 'created',
      entityType: 'lead',
      entityId: lead.id,
      entityName: lead.title,
      description: `创建销售线索 "${lead.title}"，预估金额 ¥${lead.estimatedValue.format()}`,
    });

    return lead;
  }

  // 线索Qualified转换为商机
  async qualifyLead(
    lead: SalesLead,
    qualifyData: QualifyData
  ): Promise<{
    lead: SalesLead;
    opportunity: SalesOpportunity;
  }> {
    // 1. 执行Qualified转换
    const { opportunityData: oppData } = lead.qualify(qualifyData);

    // 2. 创建商机
    const opportunityId = `opp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const opportunity = SalesOpportunity.createFromLead({
      id: opportunityId,
      data: oppData,
    });

    // 3. 发布领域事件
    this.eventBus.publish(new LeadQualifiedEvent({
      leadId: lead.id,
      opportunityId: opportunity.id,
      title: opportunity.title,
      customerId: opportunity.customerId,
      customerName: opportunity.customerName,
      value: opportunity.value.amount,
    }));

    this.eventBus.publish(new OpportunityCreatedEvent({
      opportunityId: opportunity.id,
      title: opportunity.title,
      customerId: opportunity.customerId,
      customerName: opportunity.customerName,
      value: opportunity.value.amount,
      stage: opportunity.stage.value,
      sourceLeadId: lead.id,
    }));

    // 4. 记录活动
    await this.activityRecorder.log({
      type: 'stage_change',
      entityType: 'lead',
      entityId: lead.id,
      entityName: lead.title,
      description: `销售线索 "${lead.title}" 已Qualified，转为商机`,
    });

    return { lead, opportunity };
  }

  // 放弃线索
  async disqualifyLead(lead: SalesLead, reason?: string): Promise<SalesLead> {
    // 1. 执行放弃操作
    lead.disqualify(reason);

    // 2. 发布领域事件
    this.eventBus.publish(new LeadDisqualifiedEvent({
      leadId: lead.id,
      title: lead.title,
      reason,
    }));

    // 3. 记录活动
    await this.activityRecorder.log({
      type: 'disqualified',
      entityType: 'lead',
      entityId: lead.id,
      entityName: lead.title,
      description: `销售线索 "${lead.title}" 已被放弃${reason ? `，原因: ${reason}` : ''}`,
    });

    return lead;
  }

  // 变更机会阶段（核心方法）
  async changeOpportunityStage(
    opportunity: SalesOpportunity,
    newStageType: string,
    reason?: string
  ): Promise<StageChangeResult> {
    // 1. 创建新的阶段值对象
    const newStage = OpportunityStage.create(newStageType as OpportunityStageType);

    // 2. 执行阶段变更（包含验证）
    const result = opportunity.changeStage(newStage, reason);

    // 3. 发布领域事件
    this.eventBus.publish(new OpportunityStageChangedEvent({
      opportunityId: opportunity.id,
      title: opportunity.title,
      oldStage: result.oldStage.value,
      newStage: result.newStage.value,
      reason,
    }));

    // 4. 如果是成交或失败，发布专门事件
    if (result.isWon) {
      this.eventBus.publish(new OpportunityClosedWonEvent({
        opportunityId: opportunity.id,
        title: opportunity.title,
        customerId: opportunity.customerId,
        customerName: opportunity.customerName,
        finalValue: opportunity.value.amount,
      }));

      await this.activityRecorder.log({
        type: 'closed_won',
        entityType: 'opportunity',
        entityId: opportunity.id,
        entityName: opportunity.title,
        description: `商机 "${opportunity.title}" 成交！金额: ${opportunity.value.format()}`,
      });
    }

    if (result.isLost) {
      this.eventBus.publish(new OpportunityClosedLostEvent({
        opportunityId: opportunity.id,
        title: opportunity.title,
        customerId: opportunity.customerId,
        reason,
      }));

      await this.activityRecorder.log({
        type: 'closed_lost',
        entityType: 'opportunity',
        entityId: opportunity.id,
        entityName: opportunity.title,
        description: `商机 "${opportunity.title}" 失败${reason ? `，原因: ${reason}` : ''}`,
      });
    }

    // 5. 如果是普通阶段变更，也记录活动
    if (!result.isWon && !result.isLost) {
      await this.activityRecorder.log({
        type: 'stage_change',
        entityType: 'opportunity',
        entityId: opportunity.id,
        entityName: opportunity.title,
        description: `商机 "${opportunity.title}" 从 ${result.oldStage.getLabel()} 变更为 ${result.newStage.getLabel()}`,
      });
    }

    return result;
  }
}
