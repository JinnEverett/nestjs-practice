// ex02 · Money — đáp án best practice
//
// - State nằm trong #private field + chỉ có getter → bên ngoài không sửa được, Object.keys rỗng.
// - Validate trong constructor ("không thể tạo Money sai") → mọi chỗ dùng Money không phải kiểm lại.
// - Mọi phép toán trả Money MỚI (bất biến) → chia sẻ Money giữa nhiều chỗ không sợ bị sửa ngầm.
// - #assertSameCurrency gom logic kiểm tra dùng chung cho add/subtract.
// - toJSON quyết định hình dạng khi serialize (không lộ chi tiết nội bộ).
// Thư viện thật: dinero.js; hoặc numeric + decimal.js khi cần số lẻ (R09).
export class Money {
  #amount;
  #currency;

  constructor(amount, currency = 'VND') {
    if (!Number.isSafeInteger(amount)) throw new RangeError(`Invalid amount: ${amount}`);
    if (typeof currency !== 'string' || !/^[A-Z]{3}$/.test(currency)) throw new RangeError(`Invalid currency: ${currency}`);
    this.#amount = amount;
    this.#currency = currency;
  }

  static zero(currency = 'VND') {
    return new Money(0, currency);
  }

  get amount() {
    return this.#amount;
  }

  get currency() {
    return this.#currency;
  }

  add(other) {
    this.#assertSameCurrency(other);
    return new Money(this.#amount + other.amount, this.#currency);
  }

  subtract(other) {
    this.#assertSameCurrency(other);
    return new Money(this.#amount - other.amount, this.#currency);
  }

  multiply(factor) {
    return new Money(Math.round(this.#amount * factor), this.#currency);
  }

  equals(other) {
    return other instanceof Money && other.amount === this.#amount && other.currency === this.#currency;
  }

  toString() {
    return `${this.#amount} ${this.#currency}`;
  }

  toJSON() {
    return { amount: this.#amount, currency: this.#currency };
  }

  #assertSameCurrency(other) {
    if (other.currency !== this.#currency) {
      throw new TypeError(`Currency mismatch: ${this.#currency} vs ${other.currency}`);
    }
  }
}
