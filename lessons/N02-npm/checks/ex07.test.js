import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bump, releaseType, nextVersion } from '../answers/ex07.js';

test('ex07 · bump major/minor/patch reset phần thấp hơn', () => {
  assert.equal(bump('1.4.2', 'major'), '2.0.0');
  assert.equal(bump('1.4.2', 'minor'), '1.5.0');
  assert.equal(bump('1.4.2', 'patch'), '1.4.3');
  assert.equal(bump('0.9.9', 'patch'), '0.9.10');
});
test('ex07 · bump ném RangeError với level lạ hoặc version sai', () => {
  assert.throws(() => bump('1.4.2', 'huge'), RangeError);
  assert.throws(() => bump('1.4', 'patch'), RangeError);
  assert.throws(() => bump('v1.4.2', 'patch'), RangeError);
});
test('ex07 · releaseType: fix → patch, perf → patch', () => {
  assert.equal(releaseType(['fix: sửa lỗi null']), 'patch');
  assert.equal(releaseType(['perf(db): thêm index']), 'patch');
});
test('ex07 · releaseType: feat → minor, thắng fix', () => {
  assert.equal(releaseType(['fix: a', 'feat(orders): thêm filter', 'fix: b']), 'minor');
});
test('ex07 · releaseType: dấu ! → major', () => {
  assert.equal(releaseType(['feat!: đổi response']), 'major');
  assert.equal(releaseType(['refactor(api)!: bỏ field cũ']), 'major');
});
test('ex07 · releaseType: BREAKING CHANGE trong body → major', () => {
  assert.equal(releaseType(['feat: x\n\nBREAKING CHANGE: bỏ endpoint /v1']), 'major');
  assert.equal(releaseType(['fix: y\n\nchi tiết...\nBREAKING CHANGE: đổi schema']), 'major');
});
test('ex07 · releaseType: "BREAKING CHANGE" nằm giữa dòng không tính', () => {
  assert.equal(releaseType(['fix: mention BREAKING CHANGE: trong tiêu đề']), 'patch');
});
test('ex07 · releaseType: chore/docs/refactor/test → null; rỗng → null; không đúng dạng → null', () => {
  assert.equal(releaseType(['chore: bump deps', 'docs: readme', 'refactor: tách hàm', 'test: thêm test']), null);
  assert.equal(releaseType([]), null);
  assert.equal(releaseType(['Merge branch main', 'update stuff']), null);
});
test('ex07 · releaseType: "feature:" không phải "feat:"', () => {
  assert.equal(releaseType(['feature: sai type']), null);
});
test('ex07 · nextVersion', () => {
  assert.equal(nextVersion('1.4.2', ['fix: a']), '1.4.3');
  assert.equal(nextVersion('1.4.2', ['feat: a', 'fix: b']), '1.5.0');
  assert.equal(nextVersion('1.4.2', ['feat!: a']), '2.0.0');
  assert.equal(nextVersion('1.4.2', ['chore: a']), '1.4.2');
});
