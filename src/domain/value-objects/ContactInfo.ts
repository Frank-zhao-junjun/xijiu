// 值对象: 联系人信息
export class ContactInfo {
  private constructor(
    public readonly email: string | null,
    public readonly phone: string | null
  ) {}

  static create(email?: string, phone?: string): ContactInfo {
    // 验证邮箱格式
    if (email && !this.isValidEmail(email)) {
      throw new Error('邮箱格式不正确');
    }
    // 验证电话格式
    if (phone && !this.isValidPhone(phone)) {
      throw new Error('电话格式不正确');
    }
    return new ContactInfo(email || null, phone || null);
  }

  static empty(): ContactInfo {
    return new ContactInfo(null, null);
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    // 允许国际格式
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 7;
  }

  hasEmail(): boolean {
    return !!this.email;
  }

  hasPhone(): boolean {
    return !!this.phone;
  }

  isEmpty(): boolean {
    return !this.email && !this.phone;
  }

  equals(other: ContactInfo): boolean {
    return this.email === other.email && this.phone === other.phone;
  }
}
