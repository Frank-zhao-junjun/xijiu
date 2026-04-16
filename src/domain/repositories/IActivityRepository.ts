// 仓储接口: 活动记录
export interface ActivityRecord {
  id: string;
  type: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  timestamp: string;
}

export interface IActivityRepository {
  save(record: Omit<ActivityRecord, 'id'>): Promise<void>;
  findByEntity(entityType: string, entityId: string): Promise<ActivityRecord[]>;
  findRecent(limit: number): Promise<ActivityRecord[]>;
}
