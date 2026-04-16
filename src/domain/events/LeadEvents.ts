// 线索相关领域事件
import { DomainEvent, generateEventId } from './DomainEvent';
import type { LeadSourceType } from '../value-objects/LeadSource';

export interface LeadCreatedPayload {
  leadId: string;
  title: string;
  customerId: string;
  customerName: string;
  estimatedValue: number;
  source: LeadSourceType;
}

export class LeadCreatedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'LeadCreated';

  constructor(public readonly payload: LeadCreatedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}

export interface LeadStatusChangedPayload {
  leadId: string;
  title: string;
  oldStatus: string;
  newStatus: string;
}

export class LeadStatusChangedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'LeadStatusChanged';

  constructor(public readonly payload: LeadStatusChangedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}

export interface LeadQualifiedPayload {
  leadId: string;
  opportunityId: string;
  title: string;
  customerId: string;
  customerName: string;
  value: number;
}

export class LeadQualifiedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'LeadQualified';

  constructor(public readonly payload: LeadQualifiedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}

export interface LeadDisqualifiedPayload {
  leadId: string;
  title: string;
  reason?: string;
}

export class LeadDisqualifiedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'LeadDisqualified';

  constructor(public readonly payload: LeadDisqualifiedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}
