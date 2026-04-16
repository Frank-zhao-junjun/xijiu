// 实体: 联系人
import { PersonName, ContactInfo } from '../value-objects';

export interface ContactProps {
  id: string;
  customerId: string;
  name: PersonName;
  contactInfo: ContactInfo;
  position: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Contact {
  private props: ContactProps;

  constructor(props: ContactProps) {
    this.props = props;
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get name(): PersonName {
    return this.props.name;
  }

  get contactInfo(): ContactInfo {
    return this.props.contactInfo;
  }

  get position(): string {
    return this.props.position;
  }

  get isPrimary(): boolean {
    return this.props.isPrimary;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Domain Methods
  setAsPrimary(): void {
    this.props.isPrimary = true;
    this.props.updatedAt = new Date();
  }

  updateName(name: PersonName): void {
    this.props.name = name;
    this.props.updatedAt = new Date();
  }

  updateContactInfo(contactInfo: ContactInfo): void {
    this.props.contactInfo = contactInfo;
    this.props.updatedAt = new Date();
  }

  updatePosition(position: string): void {
    this.props.position = position;
    this.props.updatedAt = new Date();
  }

  // Factory
  static create(params: {
    id: string;
    customerId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    position: string;
    isPrimary?: boolean;
  }): Contact {
    return new Contact({
      id: params.id,
      customerId: params.customerId,
      name: PersonName.create(params.firstName, params.lastName),
      contactInfo: ContactInfo.create(params.email, params.phone),
      position: params.position,
      isPrimary: params.isPrimary ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Reconstitute from DB
  static reconstitute(props: ContactProps): Contact {
    return new Contact(props);
  }

  toPlainObject() {
    return {
      id: this.id,
      customerId: this.customerId,
      firstName: this.name.firstName,
      lastName: this.name.lastName,
      email: this.contactInfo.email,
      phone: this.contactInfo.phone,
      position: this.position,
      isPrimary: this.isPrimary,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
