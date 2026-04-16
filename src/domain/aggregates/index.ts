// 导出所有聚合根
export { Customer, type CustomerProps } from './CustomerAggregate';
export { Contact, type ContactProps } from '../entities/Contact';
export { SalesLead, type SalesLeadProps, type QualifyData } from './SalesLeadAggregate';
export { SalesOpportunity, type SalesOpportunityProps, type OpportunityData, type StageChangeResult } from './SalesOpportunityAggregate';
