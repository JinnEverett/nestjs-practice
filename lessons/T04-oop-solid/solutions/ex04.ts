// ex04 · Shipping strategies — đáp án best practice (Strategy + Open/Closed)
//
// - Mỗi cách tính phí là một class nhỏ implement cùng interface → thêm gói mới = thêm class, không sửa calculator.
// - FreeShippingOver bọc một strategy khác (composition) thay vì kế thừa Standard.
// - Calculator nhận danh sách strategy (DI) → test được với object literal.
// - Hằng số có tên cho luật giá.
export interface Order {
  subtotal: number;
  weightKg: number;
}

export interface ShippingStrategy {
  readonly name: string;
  calculate(order: Order): number;
}

export class StandardShipping implements ShippingStrategy {
  readonly name = 'Tiêu chuẩn';
  static readonly BASE = 20_000;
  static readonly PER_KG = 5_000;

  calculate({ weightKg }: Order): number {
    return StandardShipping.BASE + Math.ceil(weightKg) * StandardShipping.PER_KG;
  }
}

export class ExpressShipping implements ShippingStrategy {
  readonly name = 'Hỏa tốc';
  readonly #standard = new StandardShipping();

  calculate(order: Order): number {
    return this.#standard.calculate(order) * 2;
  }
}

export class FreeShippingOver implements ShippingStrategy {
  readonly name: string;

  constructor(
    private readonly threshold: number,
    private readonly fallback: ShippingStrategy,
  ) {
    this.name = `Miễn phí từ ${threshold}`;
  }

  calculate(order: Order): number {
    return order.subtotal >= this.threshold ? 0 : this.fallback.calculate(order);
  }
}

export class ShippingCalculator {
  constructor(private readonly strategies: readonly ShippingStrategy[]) {}

  quote(order: Order): { name: string; fee: number }[] {
    return this.strategies.map((s) => ({ name: s.name, fee: s.calculate(order) })).toSorted((a, b) => a.fee - b.fee);
  }

  cheapest(order: Order): { name: string; fee: number } {
    const [best] = this.quote(order);
    if (!best) throw new Error('No shipping strategy configured');
    return best;
  }
}
