// 仓储接口: 商机
import { SalesOpportunity } from '../aggregates/SalesOpportunityAggregate';

export interface OpportunityFilter {
  stage?: string;
  customerId?: string;
  search?: string;
  excludeLead?: boolean; // 是否排除线索阶段
}

export interface ISalesOpportunityRepository {
  findById(id: string): Promise<SalesOpportunity | null>;
  findAll(filter?: OpportunityFilter): Promise<SalesOpportunity[]>;
  findByCustomerId(customerId: string): Promise<SalesOpportunity[]>;
  findByStage(stage: string): Promise<SalesOpportunity[]>;
  save(opportunity: SalesOpportunity): Promise<void>;
  delete(id: string): Promise<void>;
}
