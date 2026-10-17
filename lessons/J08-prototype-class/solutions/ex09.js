// ex09 · Order state machine — đáp án best practice
//
// - Bảng TRANSITIONS (dữ liệu) mô tả luật nghiệp vụ; code chỉ tra bảng → thêm trạng thái mới không phải
//   sửa chuỗi if/else. Dùng Map để 'toString' không khớp nhầm.
// - Custom error mang dữ liệu có cấu trúc (from, to) → tầng trên map sang HTTP 409 Conflict (C06).
// - Mọi method nghiệp vụ đi qua #transition duy nhất → kiểm tra + ghi history nhất quán.
// - status chỉ có getter; history trả bản copy sâu 1 tầng → không sửa được từ ngoài.
// - Trả `this` cho phép gọi nối. Đồng hồ tiêm vào để test.
// Trong DB: cột status + CHECK constraint, và UPDATE ... WHERE status = 'pending' để chống race (R08).
const TRANSITIONS = new Map([
  ['pending', new Set(['paid', 'cancelled'])],
  ['paid', new Set(['shipped', 'refunded'])],
  ['shipped', new Set(['delivered'])],
  ['delivered', new Set()],
  ['cancelled', new Set()],
  ['refunded', new Set()],
]);

export class InvalidTransitionError extends Error {
  constructor(from, to) {
    super(`Cannot transition order from "${from}" to "${to}"`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
  }
}

export class Order {
  #status = 'pending';
  #history = [];
  #now;

  constructor({ id, now = () => new Date() }) {
    this.id = id;
    this.#now = now;
  }

  get status() {
    return this.#status;
  }

  get history() {
    return this.#history.map((entry) => ({ ...entry }));
  }

  canTransitionTo(status) {
    return TRANSITIONS.get(this.#status)?.has(status) ?? false;
  }

  pay() {
    return this.#transition('paid');
  }

  ship() {
    return this.#transition('shipped');
  }

  deliver() {
    return this.#transition('delivered');
  }

  cancel() {
    return this.#transition('cancelled');
  }

  refund() {
    return this.#transition('refunded');
  }

  #transition(to) {
    if (!this.canTransitionTo(to)) throw new InvalidTransitionError(this.#status, to);
    this.#history.push({ from: this.#status, to, at: this.#now() });
    this.#status = to;
    return this;
  }
}
