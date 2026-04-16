// 机会相关领域事件
import { DomainEvent, generateEventId } from './DomainEvent';
import type { OpportunityStageType } from '../value-objects/OpportunityStage';

export interface OpportunityCreatedPayload {
  opportunityId: string;
  title: string;
  customerId: string;
  customerName: string;
  value: number;
  stage: OpportunityStageType;
  sourceLeadId?: string;
}

export class OpportunityCreatedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'OpportunityCreated';

  constructor(public readonly payload: OpportunityCreatedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}

export interface OpportunityStageChangedPayload {
  opportunityId: string;
  title: string;
  oldStage: OpportunityStageType;
  newStage: OpportunityStageType;
  reason?: string;
}

export class OpportunityStageChangedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'OpportunityStageChanged';

  constructor(public readonly payload: OpportunityStageChangedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}

export interface OpportunityClosedWonPayload {
  opportunityId: string;
  title: string;
  customerId: string;
  customerName: string;
  finalValue: number;
}

export class OpportunityClosedWonEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'OpportunityClosedWon';

  constructor(public readonly payload: OpportunityClosedWonPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}

export interface OpportunityClosedLostPayload {
  opportunityId: string;
  title: string;
  customerId: string;
  reason?: string;
}

export class OpportunityClosedLostEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'OpportunityClosedLost';

  constructor(public readonly payload: OpportunityClosedLostPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}
