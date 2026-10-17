import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildTree } from '../answers/ex08.js';

const reg = (o) => o;

test('ex08 · không dependency → {}', () => assert.deepEqual(buildTree({}, {}), {}));

test('ex08 · chuỗi a → b → c: tất cả hoist lên gốc, chọn bản lớn nhất khớp range', () => {
  const registry = reg({
    a: { '1.0.0': { dependencies: { b: '^1.0.0' } }, '1.1.0': { dependencies: { b: '^1.0.0' } }, '2.0.0': {} },
    b: { '1.0.0': { dependencies: { c: '~1.2.0' } }, '1.3.0': { dependencies: { c: '~1.2.0' } } },
    c: { '1.2.0': {}, '1.2.5': {}, '1.3.0': {} },
  });
  assert.deepEqual(buildTree({ a: '^1.0.0' }, registry), {
    'node_modules/a': '1.1.0',
    'node_modules/b': '1.3.0',
    'node_modules/c': '1.2.5',
  });
});
test('ex08 · kim cương: dùng lại bản đã cài nếu thỏa range', () => {
  const registry = reg({
    a: { '1.0.0': { dependencies: { c: '^1.0.0' } } },
    b: { '1.0.0': { dependencies: { c: '^1.1.0' } } },
    c: { '1.0.0': {}, '1.2.0': {}, '2.0.0': {} },
  });
  assert.deepEqual(buildTree({ a: '^1.0.0', b: '^1.0.0' }, registry), {
    'node_modules/a': '1.0.0',
    'node_modules/b': '1.0.0',
    'node_modules/c': '1.2.0',
  });
});
test('ex08 · xung đột MAJOR: bản đến sau được lồng dưới requester', () => {
  const registry = reg({
    a: { '1.0.0': { dependencies: { c: '^1.0.0' } } },
    b: { '1.0.0': { dependencies: { c: '^2.0.0' } } },
    c: { '1.0.0': {}, '1.2.0': {}, '2.0.0': {} },
  });
  assert.deepEqual(buildTree({ a: '^1.0.0', b: '^1.0.0' }, registry), {
    'node_modules/a': '1.0.0',
    'node_modules/b': '1.0.0',
    'node_modules/c': '1.2.0',
    'node_modules/b/node_modules/c': '2.0.0',
  });
});
test('ex08 · thứ tự duyệt theo alphabet, không theo thứ tự khai báo', () => {
  const registry = reg({
    a: { '1.0.0': { dependencies: { c: '^1.0.0' } } },
    b: { '1.0.0': { dependencies: { c: '^2.0.0' } } },
    c: { '1.0.0': {}, '2.0.0': {} },
  });
  const t = buildTree({ b: '^1.0.0', a: '^1.0.0' }, registry);
  assert.equal(t['node_modules/c'], '1.0.0');
  assert.equal(t['node_modules/b/node_modules/c'], '2.0.0');
});
test('ex08 · dependency của package lồng: tìm ngược lên qua cả thư mục lồng', () => {
  const registry = reg({
    a: { '1.0.0': { dependencies: { c: '^2.0.0' } } },
    c: { '1.0.0': {}, '2.0.0': { dependencies: { e: '^1.0.0' } } },
    e: { '1.0.0': {} },
  });
  assert.deepEqual(buildTree({ c: '^1.0.0', a: '^1.0.0' }, registry), {
    'node_modules/a': '1.0.0',
    'node_modules/c': '1.0.0',
    'node_modules/a/node_modules/c': '2.0.0',
    'node_modules/e': '1.0.0',
  });
});
test('ex08 · dependency của package lồng tìm thấy bản đã nằm trong chính thư mục lồng đó', () => {
  const registry = reg({
    a: { '1.0.0': { dependencies: { c: '^2.0.0' } } },
    c: { '1.0.0': {}, '2.0.0': { dependencies: { d: '^1.0.0' } } },
    d: { '1.0.0': { dependencies: { c: '^2.0.0' } } },
  });
  const t = buildTree({ c: '^1.0.0', a: '^1.0.0' }, registry);
  // d được cài ở gốc; c@2 (lồng dưới a) yêu cầu d; d yêu cầu c@^2: từ node_modules/d đi lên gốc gặp c@1 (không khớp) → lồng dưới d
  assert.deepEqual(t, {
    'node_modules/a': '1.0.0',
    'node_modules/c': '1.0.0',
    'node_modules/a/node_modules/c': '2.0.0',
    'node_modules/d': '1.0.0',
    'node_modules/d/node_modules/c': '2.0.0',
  });
});
test('ex08 · vòng phụ thuộc a ↔ b không làm treo', () => {
  const registry = reg({
    a: { '1.0.0': { dependencies: { b: '^1.0.0' } } },
    b: { '1.0.0': { dependencies: { a: '^1.0.0' } } },
  });
  assert.deepEqual(buildTree({ a: '^1.0.0' }, registry), { 'node_modules/a': '1.0.0', 'node_modules/b': '1.0.0' });
});
test('ex08 · package không tồn tại', () => {
  assert.throws(() => buildTree({ ghost: '^1.0.0' }, {}), { message: 'Package not found: ghost' });
});
test('ex08 · không có version khớp', () => {
  assert.throws(() => buildTree({ a: '^9.0.0' }, { a: { '1.0.0': {} } }), { message: 'No matching version for a@^9.0.0' });
});
test('ex08 · không mutate registry và rootDeps', () => {
  const registry = Object.freeze({ a: Object.freeze({ '1.0.0': Object.freeze({}) }) });
  const root = Object.freeze({ a: '^1.0.0' });
  assert.doesNotThrow(() => buildTree(root, registry));
});
