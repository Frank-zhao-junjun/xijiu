// 值对象: 销售线索状态
export type LeadStatusType = 'new' | 'contacted' | 'qualified' | 'disqualified';

export class LeadStatus {
  private constructor(public readonly value: LeadStatusType) {}

  static create(value: LeadStatusType): LeadStatus {
    return new LeadStatus(value);
  }

  static new(): LeadStatus {
    return new LeadStatus('new');
  }

  static contacted(): LeadStatus {
    return new LeadStatus('contacted');
  }

  static qualified(): LeadStatus {
    return new LeadStatus('qualified');
  }

  static disqualified(): LeadStatus {
    return new LeadStatus('disqualified');
  }

  canQualify(): boolean {
    return this.value === 'new' || this.value === 'contacted';
  }

  isQualified(): boolean {
    return this.value === 'qualified';
  }

  equals(other: LeadStatus): boolean {
    return this.value === other.value;
  }

  getLabel(): string {
    const labels: Record<LeadStatusType, string> = {
      new: '新建',
      contacted: '已联系',
      qualified: '已Qualified',
      disqualified: '已放弃',
    };
    return labels[this.value];
  }
}
