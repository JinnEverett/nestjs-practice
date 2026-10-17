import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOrderInput } from '../answers/ex05.js';
import { ValidationError } from '../answers/ex02.js';

const fieldsOf = (fn) => {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof ValidationError, 'phải ném ValidationError');
    return e.details.map((d) => d.field).toSorted();
  }
  assert.fail('phải ném lỗi');
};

test('ex05 · hợp lệ → chuẩn hóa, bỏ field lạ', () => {
  assert.deepEqual(parseOrderInput({ customerId: 5, items: [{ productId: 1, qty: 2, price: 1 }], note: '  giao giờ hành chính ', isAdmin: true }), {
    customerId: 5,
    items: [{ productId: 1, qty: 2 }],
    note: 'giao giờ hành chính',
  });
  assert.equal(parseOrderInput({ customerId: 5, items: [{ productId: 1, qty: 1 }], note: '   ' }).note, undefined);
});
test('ex05 · body không phải object', () => {
  for (const b of [null, [], 'x', 5]) assert.deepEqual(fieldsOf(() => parseOrderInput(b)), ['body']);
});
test('ex05 · gom MỌI lỗi một lần', () => {
  const fields = fieldsOf(() =>
    parseOrderInput({ customerId: -1, items: [{ productId: 1, qty: 0 }, { productId: 'x', qty: 2 }, { productId: 2, qty: 100 }], note: 5 }),
  );
  assert.deepEqual(fields, ['customerId', 'items[0].qty', 'items[1].productId', 'items[2].qty', 'note']);
});
test('ex05 · items rỗng / thiếu / quá nhiều', () => {
  assert.deepEqual(fieldsOf(() => parseOrderInput({ customerId: 1, items: [] })), ['items']);
  assert.deepEqual(fieldsOf(() => parseOrderInput({ customerId: 1 })), ['items']);
  const many = Array.from({ length: 51 }, () => ({ productId: 1, qty: 1 }));
  assert.deepEqual(fieldsOf(() => parseOrderInput({ customerId: 1, items: many })), ['items']);
});
test('ex05 · note quá dài, customerId thập phân, item không phải object', () => {
  assert.deepEqual(fieldsOf(() => parseOrderInput({ customerId: 1.5, items: [null], note: 'a'.repeat(501) })), ['customerId', 'items[0]', 'note']);
});
