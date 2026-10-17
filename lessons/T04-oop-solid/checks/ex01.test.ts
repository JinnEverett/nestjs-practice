import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BankAccount, InsufficientFundsError } from '../answers/ex01.js';

function _typeTests(a: BankAccount) {
  // @ts-expect-error balance chỉ đọc
  a.balance = 1;
  // @ts-expect-error owner readonly
  a.owner = 'x';
  const owner: string = a.owner;
  void owner;
}

test('ex01 · nạp / rút', () => {
  const a = new BankAccount('An', 100);
  a.deposit(50);
  a.withdraw(30);
  assert.equal(a.balance, 120);
  assert.equal(a.owner, 'An');
  assert.deepEqual(a.history, [
    { type: 'deposit', amount: 50 },
    { type: 'withdraw', amount: 30 },
  ]);
});
test('ex01 · validate', () => {
  const a = new BankAccount('An');
  for (const v of [0, -1, 1.5]) assert.throws(() => a.deposit(v), RangeError);
  assert.throws(
    () => a.withdraw(10),
    (e: unknown) => e instanceof InsufficientFundsError && e instanceof Error && e.shortBy === 10,
  );
  assert.equal(a.balance, 0);
});
test('ex01 · history là bản copy', () => {
  const a = new BankAccount('An');
  a.deposit(1);
  a.history.push({ type: 'deposit', amount: 999 });
  assert.equal(a.history.length, 1);
});
