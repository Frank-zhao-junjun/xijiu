// 值对象: 地址
export class Address {
  private constructor(
    public readonly street: string | null,
    public readonly city: string | null,
    public readonly province: string | null,
    public readonly country: string = '中国'
  ) {}

  static create(street?: string, city?: string, province?: string, country?: string): Address {
    return new Address(
      street?.trim() || null,
      city?.trim() || null,
      province?.trim() || null,
      country || '中国'
    );
  }

  static empty(): Address {
    return new Address(null, null, null);
  }

  getFullAddress(): string {
    const parts = [this.province, this.city, this.street, this.country].filter(Boolean);
    return parts.join('');
  }

  isEmpty(): boolean {
    return !this.street && !this.city && !this.province;
  }

  equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.province === other.province &&
      this.country === other.country
    );
  }
}
