// 领域事件基类
export interface DomainEvent {
  occurredAt: Date;
  eventId: string;
}

export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
