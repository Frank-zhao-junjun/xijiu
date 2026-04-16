// 值对象: 百分比
export class Percentage {
  private constructor(public readonly value: number) {}

  static create(value: number): Percentage {
    if (value < 0 || value > 100) {
      throw new Error('百分比值必须在 0-100 之间');
    }
    return new Percentage(value);
  }

  static fromDecimal(decimal: number): Percentage {
    return Percentage.create(Math.round(decimal * 100));
  }

  toDecimal(): number {
    return this.value / 100;
  }

  equals(other: Percentage): boolean {
    return this.value === other.value;
  }
}
