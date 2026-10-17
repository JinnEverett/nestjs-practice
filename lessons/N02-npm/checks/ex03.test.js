import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDrift } from '../answers/ex03.js';

const lock = (rootDeps, installed) => ({
  lockfileVersion: 3,
  packages: {
    '': { name: 'app', dependencies: rootDeps.dependencies ?? {}, devDependencies: rootDeps.devDependencies ?? {} },
    ...Object.fromEntries(Object.entries(installed).map(([k, v]) => [k.startsWith('node_modules/') ? k : `node_modules/${k}`, { version: v }])),
  },
});

test('ex03 · khớp hoàn toàn → []', () => {
  const pkg = { dependencies: { express: '^5.0.0' }, devDependencies: { jest: '^30.0.0' } };
  const l = lock(pkg, { express: '5.1.0', jest: '30.2.0' });
  assert.deepEqual(findDrift(pkg, l), []);
});
test('ex03 · missing: package.json có mà lockfile không có bản cài', () => {
  const pkg = { dependencies: { express: '^5.0.0', pg: '^8.0.0' } };
  const l = lock(pkg, { express: '5.1.0' });
  assert.deepEqual(findDrift(pkg, l), [{ name: 'pg', range: '^8.0.0', locked: null, reason: 'missing' }]);
});
test('ex03 · out-of-range: bản khóa không khớp range mới', () => {
  const pkg = { dependencies: { express: '^5.0.0' } };
  const l = lock({ dependencies: { express: '^5.0.0' } }, { express: '4.19.2' });
  assert.deepEqual(findDrift(pkg, l), [{ name: 'express', range: '^5.0.0', locked: '4.19.2', reason: 'out-of-range' }]);
});
test('ex03 · range-mismatch: bản khóa vẫn hợp lệ nhưng package.json đã đổi range, lockfile chưa cập nhật', () => {
  const pkg = { dependencies: { express: '~5.1.0' } };
  const l = lock({ dependencies: { express: '^5.0.0' } }, { express: '5.1.0' });
  assert.deepEqual(findDrift(pkg, l), [{ name: 'express', range: '~5.1.0', locked: '5.1.0', reason: 'range-mismatch' }]);
});
test('ex03 · mỗi dependency chỉ báo một lý do (out-of-range ưu tiên hơn range-mismatch)', () => {
  const pkg = { dependencies: { a: '^2.0.0' } };
  const l = lock({ dependencies: { a: '^1.0.0' } }, { a: '1.5.0' });
  const r = findDrift(pkg, l);
  assert.equal(r.length, 1);
  assert.equal(r[0].reason, 'out-of-range');
});
test('ex03 · duyệt cả devDependencies và optionalDependencies, sắp theo tên', () => {
  const pkg = { dependencies: { zeta: '^1.0.0' }, devDependencies: { alpha: '^1.0.0' }, optionalDependencies: { mid: '^1.0.0' } };
  const l = { lockfileVersion: 3, packages: { '': {} } };
  assert.deepEqual(findDrift(pkg, l).map((d) => d.name), ['alpha', 'mid', 'zeta']);
});
test('ex03 · chỉ nhìn node_modules/<name> ở gốc, không nhầm với bản lồng nhau', () => {
  const pkg = { dependencies: { ms: '^2.0.0' } };
  const l = {
    lockfileVersion: 3,
    packages: { '': { dependencies: { ms: '^2.0.0' } }, 'node_modules/foo/node_modules/ms': { version: '2.1.3' } },
  };
  assert.deepEqual(findDrift(pkg, l), [{ name: 'ms', range: '^2.0.0', locked: null, reason: 'missing' }]);
});
test('ex03 · package.json không có dependency nào → []', () => {
  assert.deepEqual(findDrift({}, { lockfileVersion: 3, packages: {} }), []);
});
