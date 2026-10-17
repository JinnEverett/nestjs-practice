// ex01 · BankAccount — đáp án best practice
//
// - Parameter property `public readonly owner` → khai báo + gán trong một chỗ (rất phổ biến trong service Nest:
//   constructor(private readonly repo: UserRepository) {}).
// - Số dư là `#balance` (private thật lúc chạy) + getter → bên ngoài chỉ đọc.
// - Custom error có dữ liệu (shortBy) để tầng trên trả message có ích.
// - #assertPositive gom validate; history trả bản copy.
// Tiền dùng số nguyên (đồng) — J01/J07.
export class InsufficientFundsError extends Error {
  override name = 'InsufficientFundsError';
  constructor(public readonly shortBy: number) {
    super(`Insufficient funds: short by ${shortBy}`);
  }
}

type Entry = { type: 'deposit' | 'withdraw'; amount: number };

export class BankAccount {
  #balance: number;
  #history: Entry[] = [];

  constructor(
    public readonly owner: string,
    initialBalance = 0,
  ) {
    this.#balance = initialBalance;
  }

  get balance(): number {
    return this.#balance;
  }

  get history(): Entry[] {
    return this.#history.map((e) => ({ ...e }));
  }

  deposit(amount: number): void {
    BankAccount.#assertPositive(amount);
    this.#balance += amount;
    this.#history.push({ type: 'deposit', amount });
  }

  withdraw(amount: number): void {
    BankAccount.#assertPositive(amount);
    if (amount > this.#balance) throw new InsufficientFundsError(amount - this.#balance);
    this.#balance -= amount;
    this.#history.push({ type: 'withdraw', amount });
  }

  static #assertPositive(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) throw new RangeError(`Amount must be a positive integer, got ${amount}`);
  }
}
