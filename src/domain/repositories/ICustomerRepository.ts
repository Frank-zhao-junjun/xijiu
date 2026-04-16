// 仓储接口: 客户
import { Customer } from '../aggregates/CustomerAggregate';
import { Contact } from '../entities/Contact';

export interface CustomerFilter {
  status?: string;
  search?: string;
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  findAll(filter?: CustomerFilter): Promise<Customer[]>;
  save(customer: Customer): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IContactRepository {
  findById(id: string): Promise<Contact | null>;
  findByCustomerId(customerId: string): Promise<Contact[]>;
  save(contact: Contact): Promise<void>;
  delete(id: string): Promise<void>;
}
