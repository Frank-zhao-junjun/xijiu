// 仓储接口: 销售线索
import { SalesLead } from '../aggregates/SalesLeadAggregate';

export interface LeadFilter {
  status?: string;
  source?: string;
  customerId?: string;
  search?: string;
}

export interface ISalesLeadRepository {
  findById(id: string): Promise<SalesLead | null>;
  findAll(filter?: LeadFilter): Promise<SalesLead[]>;
  findByCustomerId(customerId: string): Promise<SalesLead[]>;
  save(lead: SalesLead): Promise<void>;
  delete(id: string): Promise<void>;
}
