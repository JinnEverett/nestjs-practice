import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintPackageJson } from '../answers/ex06.js';

const good = {
  private: true,
  engines: { node: '>=24' },
  scripts: { start: 'node dist/main' },
  dependencies: { '@nestjs/common': '^12.0.0', pg: '^8.0.0' },
  devDependencies: { typescript: '^5.9.0', jest: '^30.0.0', '@types/node': '^24.0.0' },
};
const codes = (pkg) => lintPackageJson(pkg).map((i) => (i.name ? `${i.code}:${i.name}` : i.code));

test('ex06 · package.json sạch → []', () => assert.deepEqual(lintPackageJson(good), []));
test('ex06 · floating-range: *, latest, rỗng, chỉ cận dưới', () => {
  const pkg = { ...good, dependencies: { a: '*', b: 'latest', c: '', d: '>=1.0.0', e: '>2', f: '>=1.0.0 <2.0.0', g: '^1.0.0' } };
  assert.deepEqual(codes(pkg), ['floating-range:a', 'floating-range:b', 'floating-range:c', 'floating-range:d', 'floating-range:e']);
});
test('ex06 · floating-range áp dụng cả devDependencies', () => {
  assert.deepEqual(codes({ ...good, devDependencies: { ...good.devDependencies, eslint: '*' } }), ['floating-range:eslint']);
});
test('ex06 · tool-in-dependencies: công cụ dev và @types/* nằm sai nhóm', () => {
  const pkg = { ...good, dependencies: { ...good.dependencies, typescript: '^5.9.0', '@types/express': '^5.0.0', '@nestjs/cli': '^12.0.0', jest: '^30.0.0' }, devDependencies: {} };
  assert.deepEqual(codes(pkg), [
    'tool-in-dependencies:@nestjs/cli',
    'tool-in-dependencies:@types/express',
    'tool-in-dependencies:jest',
    'tool-in-dependencies:typescript',
  ]);
});
test('ex06 · duplicate-dependency: cùng tên hai nhóm', () => {
  const pkg = { ...good, dependencies: { ...good.dependencies, zod: '^3.0.0' }, devDependencies: { ...good.devDependencies, zod: '^3.0.0' } };
  assert.deepEqual(codes(pkg), ['duplicate-dependency:zod']);
});
test('ex06 · url-dependency: git, github, http, user/repo', () => {
  const pkg = { ...good, dependencies: { a: 'git+https://x.git', b: 'github:user/repo', c: 'https://x/y.tgz', d: 'user/repo', e: 'git://h/r', f: '^1.0.0' } };
  assert.deepEqual(codes(pkg), ['url-dependency:a', 'url-dependency:b', 'url-dependency:c', 'url-dependency:d', 'url-dependency:e']);
});
test('ex06 · missing-engines, not-private, no-start-script', () => {
  assert.deepEqual(codes({ dependencies: { pg: '^8.0.0' } }), ['missing-engines', 'no-start-script', 'not-private']);
});
test('ex06 · start:prod thay cho start vẫn hợp lệ', () => {
  assert.deepEqual(codes({ ...good, scripts: { 'start:prod': 'node dist/main' } }), []);
});
test('ex06 · kết quả sắp theo code rồi name', () => {
  const pkg = { dependencies: { z: '*', a: '*', typescript: '^5.9.0' } };
  const r = lintPackageJson(pkg);
  const sorted = [...r].sort((x, y) => x.code.localeCompare(y.code) || (x.name ?? '').localeCompare(y.name ?? ''));
  assert.deepEqual(r, sorted);
  assert.equal(r[0].code, 'floating-range');
  assert.equal(r[0].name, 'a');
});
test('ex06 · không mutate pkg', () => {
  const pkg = Object.freeze({ dependencies: Object.freeze({ a: '*' }) });
  assert.doesNotThrow(() => lintPackageJson(pkg));
});
