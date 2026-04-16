// 值对象: 人名
export class PersonName {
  private constructor(
    public readonly firstName: string,
    public readonly lastName: string
  ) {}

  static create(firstName: string, lastName: string): PersonName {
    if (!firstName.trim()) {
      throw new Error('名字不能为空');
    }
    if (!lastName.trim()) {
      throw new Error('姓氏不能为空');
    }
    return new PersonName(firstName.trim(), lastName.trim());
  }

  getFullName(): string {
    return `${this.lastName}${this.firstName}`;
  }

  getShortName(): string {
    return this.firstName;
  }

  equals(other: PersonName): boolean {
    return this.firstName === other.firstName && this.lastName === other.lastName;
  }
}
