// 值对象: 线索来源
export type LeadSourceType = 'referral' | 'website' | 'cold_call' | 'event' | 'advertisement' | 'other';

export class LeadSource {
  private constructor(public readonly value: LeadSourceType) {}

  static create(value: LeadSourceType): LeadSource {
    return new LeadSource(value);
  }

  static referral(): LeadSource {
    return new LeadSource('referral');
  }

  static website(): LeadSource {
    return new LeadSource('website');
  }

  static coldCall(): LeadSource {
    return new LeadSource('cold_call');
  }

  static event(): LeadSource {
    return new LeadSource('event');
  }

  static advertisement(): LeadSource {
    return new LeadSource('advertisement');
  }

  static other(): LeadSource {
    return new LeadSource('other');
  }

  equals(other: LeadSource): boolean {
    return this.value === other.value;
  }

  getLabel(): string {
    const labels: Record<LeadSourceType, string> = {
      referral: '转介绍',
      website: '网站',
      cold_call: '电话拓展',
      event: '活动',
      advertisement: '广告',
      other: '其他',
    };
    return labels[this.value];
  }
}
