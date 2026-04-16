// 客户相关领域事件
import { DomainEvent, generateEventId } from './DomainEvent';

export interface CustomerCreatedPayload {
  customerId: string;
  name: string;
  company: string;
}

export class CustomerCreatedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'CustomerCreated';

  constructor(public readonly payload: CustomerCreatedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}

export interface CustomerUpdatedPayload {
  customerId: string;
  name: string;
  changes: string[];
}

export class CustomerUpdatedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'CustomerUpdated';

  constructor(public readonly payload: CustomerUpdatedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}

export interface CustomerDeletedPayload {
  customerId: string;
  name: string;
}

export class CustomerDeletedEvent implements DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly eventType = 'CustomerDeleted';

  constructor(public readonly payload: CustomerDeletedPayload) {
    this.occurredAt = new Date();
    this.eventId = generateEventId();
  }
}
