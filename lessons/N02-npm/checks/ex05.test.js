import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveScript, scriptCycle } from '../answers/ex05.js';

const pkg = {
  scripts: {
    prebuild: 'rimraf dist',
    build: 'nest build',
    postbuild: 'echo done',
    test: 'jest',
    lint: 'eslint .',
    ci: 'npm run lint && npm run test && npm run build',
    deploy: 'npm run-script ci --silent && ./deploy.sh',
    a: 'npm run b',
    b: 'npm run c',
    c: 'npm run a',
    self: 'npm run self',
    ghost: 'npm run not-exist',
  },
};

test('ex05 · resolveScript: thứ tự pre → chính → post', () => {
  assert.deepEqual(resolveScript(pkg, 'build'), [
    { name: 'prebuild', command: 'rimraf dist' },
    { name: 'build', command: 'nest build' },
    { name: 'postbuild', command: 'echo done' },
  ]);
});
test('ex05 · resolveScript: không có hook thì chỉ script chính', () => {
  assert.deepEqual(resolveScript(pkg, 'lint'), [{ name: 'lint', command: 'eslint .' }]);
});
test('ex05 · resolveScript: thiếu script → lỗi kèm gợi ý gần đúng', () => {
  assert.throws(() => resolveScript(pkg, 'tset'), { message: 'Missing script: "tset". Did you mean "test"?' });
  assert.throws(() => resolveScript(pkg, 'buidl'), /Did you mean "build"\?/);
});
test('ex05 · resolveScript: thiếu script, không có tên gần giống → không gợi ý', () => {
  assert.throws(() => resolveScript(pkg, 'xyzxyzxyz'), { message: 'Missing script: "xyzxyzxyz"' });
});
test('ex05 · resolveScript: package không có scripts', () => {
  assert.throws(() => resolveScript({}, 'build'), /Missing script: "build"/);
});
test('ex05 · scriptCycle: không vòng → danh sách đã thăm theo thứ tự DFS', () => {
  assert.deepEqual(scriptCycle(pkg, 'ci'), ['ci', 'lint', 'test', 'build']);
  assert.deepEqual(scriptCycle(pkg, 'deploy'), ['deploy', 'ci', 'lint', 'test', 'build']);
});
test('ex05 · scriptCycle: nhận cả run-script và đối số theo sau', () => {
  assert.ok(scriptCycle(pkg, 'deploy').includes('ci'));
});
test('ex05 · scriptCycle: phát hiện vòng a → b → c → a', () => {
  assert.throws(() => scriptCycle(pkg, 'a'), { message: 'Cycle: a -> b -> c -> a' });
});
test('ex05 · scriptCycle: tự gọi mình', () => {
  assert.throws(() => scriptCycle(pkg, 'self'), { message: 'Cycle: self -> self' });
});
test('ex05 · scriptCycle: bỏ qua script được gọi nhưng không tồn tại', () => {
  assert.deepEqual(scriptCycle(pkg, 'ghost'), ['ghost']);
});
test('ex05 · scriptCycle: script được gọi hai lần (kim cương) không bị coi là vòng', () => {
  const p = { scripts: { all: 'npm run x && npm run y', x: 'npm run z', y: 'npm run z', z: 'echo' } };
  assert.deepEqual(scriptCycle(p, 'all'), ['all', 'x', 'z', 'y']);
});
