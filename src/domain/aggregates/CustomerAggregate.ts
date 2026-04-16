// 聚合根: 客户
import { CustomerStatus, ContactInfo, Address } from '../value-objects';
import { Contact } from '../entities/Contact';

export interface CustomerProps {
  id: string;
  name: string;
  company: string;
  status: CustomerStatus;
  industry: string;
  contactInfo: ContactInfo;
  address: Address;
  website?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // 关联实体
  contacts?: Contact[];
}

export class Customer {
  private props: CustomerProps;

  constructor(props: CustomerProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get company(): string {
    return this.props.company;
  }

  get status(): CustomerStatus {
    return this.props.status;
  }

  get industry(): string {
    return this.props.industry;
  }

  get contactInfo(): ContactInfo {
    return this.props.contactInfo;
  }

  get address(): Address {
    return this.props.address;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get notes(): string | undefined {
    return this.props.notes;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get contacts(): Contact[] {
    return this.props.contacts || [];
  }

  // Domain Methods
  updateStatus(status: CustomerStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  updateInfo(params: {
    name?: string;
    company?: string;
    industry?: string;
    website?: string;
    notes?: string;
  }): void {
    if (params.name) this.props.name = params.name;
    if (params.company) this.props.company = params.company;
    if (params.industry !== undefined) this.props.industry = params.industry;
    if (params.website !== undefined) this.props.website = params.website;
    if (params.notes !== undefined) this.props.notes = params.notes;
    this.props.updatedAt = new Date();
  }

  updateContactInfo(contactInfo: ContactInfo): void {
    this.props.contactInfo = contactInfo;
    this.props.updatedAt = new Date();
  }

  updateAddress(address: Address): void {
    this.props.address = address;
    this.props.updatedAt = new Date();
  }

  addContact(contact: Contact): void {
    // 如果是主要联系人，取消其他主要联系人
    if (contact.isPrimary) {
      this.props.contacts?.forEach(c => {
        if (c.isPrimary) {
          c.setAsPrimary(); // 这里会设置isPrimary=false
        }
      });
    }
    this.props.contacts = [...(this.props.contacts || []), contact];
    this.props.updatedAt = new Date();
  }

  // Factory
  static create(params: {
    id: string;
    name: string;
    company: string;
    industry?: string;
    email?: string;
    phone?: string;
    website?: string;
    address?: string;
    notes?: string;
  }): Customer {
    const now = new Date();
    return new Customer({
      id: params.id,
      name: params.name,
      company: params.company,
      status: CustomerStatus.prospect(), // 默认潜在客户
      industry: params.industry || '',
      contactInfo: ContactInfo.create(params.email, params.phone),
      address: Address.create(params.address),
      website: params.website,
      notes: params.notes,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Reconstitute from DB
  static reconstitute(props: CustomerProps): Customer {
    return new Customer(props);
  }

  toPlainObject() {
    return {
      id: this.id,
      name: this.name,
      company: this.company,
      status: this.status.value,
      industry: this.industry,
      email: this.contactInfo.email,
      phone: this.contactInfo.phone,
      website: this.website,
      address: this.address.getFullAddress(),
      notes: this.notes,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
