// 值对象: 货币
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string = 'CNY'
  ) {}

  static create(amount: number, currency: string = 'CNY'): Money {
    if (amount < 0) {
      throw new Error('金额不能为负数');
    }
    return new Money(Math.round(amount * 100) / 100, currency);
  }

  format(): string {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: this.currency,
    }).format(this.amount);
  }

  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error('货币类型不匹配');
    }
    return Money.create(this.amount + other.amount, this.currency);
  }

  multiply(factor: number): Money {
    return Money.create(this.amount * factor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
