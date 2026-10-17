// ex05 · Product — đáp án best practice
//
// - Constructor gán QUA setter (this.name = name) → validate chạy cả lúc tạo lẫn lúc sửa, một chỗ duy nhất.
// - Kiểm tra trước, gán sau: lỗi thì state cũ giữ nguyên.
// - toJSON thêm field dẫn xuất (priceLabel) cho client mà không lưu trùng trong state.
// - fromJSON là static factory đi qua constructor → dữ liệu từ ngoài vào cũng được validate.
// Trong NestJS: validate input bằng DTO + class-validator ở biên (C05); entity/domain vẫn giữ bất biến của nó.
const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export class Product {
  #name;
  #price;

  constructor({ name, price }) {
    this.name = name;
    this.price = price;
  }

  get name() {
    return this.#name;
  }

  set name(value) {
    if (typeof value !== 'string' || value.trim() === '') throw new TypeError('name must be a non-empty string');
    this.#name = value.trim();
  }

  get price() {
    return this.#price;
  }

  set price(value) {
    if (!Number.isSafeInteger(value) || value < 0) throw new RangeError(`Invalid price: ${value}`);
    this.#price = value;
  }

  toJSON() {
    return { name: this.#name, price: this.#price, priceLabel: VND.format(this.#price) };
  }

  static fromJSON(text) {
    return new Product(JSON.parse(text));
  }
}
