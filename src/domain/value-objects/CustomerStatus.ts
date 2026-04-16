// 值对象: 客户状态
export type CustomerStatusType = 'active' | 'inactive' | 'prospect';

export class CustomerStatus {
  private constructor(public readonly value: CustomerStatusType) {}

  static create(value: CustomerStatusType): CustomerStatus {
    return new CustomerStatus(value);
  }

  static active(): CustomerStatus {
    return new CustomerStatus('active');
  }

  static inactive(): CustomerStatus {
    return new CustomerStatus('inactive');
  }

  static prospect(): CustomerStatus {
    return new CustomerStatus('prospect');
  }

  isActive(): boolean {
    return this.value === 'active';
  }

  equals(other: CustomerStatus): boolean {
    return this.value === other.value;
  }

  getLabel(): string {
    const labels: Record<CustomerStatusType, string> = {
      active: '活跃',
      inactive: '非活跃',
      prospect: '潜在客户',
    };
    return labels[this.value];
  }
}
