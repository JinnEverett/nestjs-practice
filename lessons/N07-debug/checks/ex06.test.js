import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseStack, errorChain, firstAppFrame } from '../answers/ex06.js';

const STACK = `Error: boom
    at OrdersService.create (D:\\work\\shop-api\\src\\orders\\orders.service.ts:42:11)
    at async OrdersController.post (file:///D:/work/shop-api/src/orders/orders.controller.ts:17:5)
    at new Foo (/app/src/foo.js:3:9)
    at Object.<anonymous> (/app/src/main.js:10:1)
    at fn [as alias] (/app/src/alias.js:7:2)
    at /app/src/anonymous.js:5:5
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
    at Array.map (<anonymous>)
    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)
    at C:\\Users\\dev\\proj\\node_modules\\pkg\\index.js:1:1`;

const frames = parseStack(STACK);
const by = (fn) => frames.find((f) => f.fn === fn);

test('ex06 · bỏ dòng không phải "at …" (dòng message), giữ thứ tự', () => {
  assert.equal(frames.length, 10);
  assert.equal(frames[0].fn, 'OrdersService.create');
});
test('ex06 · đường dẫn Windows: file, line, col', () => {
  assert.deepEqual(
    { file: frames[0].file, line: frames[0].line, col: frames[0].col },
    { file: 'D:\\work\\shop-api\\src\\orders\\orders.service.ts', line: 42, col: 11 },
  );
});
test('ex06 · async và URL file:///', () => {
  assert.equal(frames[1].async, true);
  assert.equal(frames[1].fn, 'OrdersController.post');
  assert.equal(frames[1].file, 'file:///D:/work/shop-api/src/orders/orders.controller.ts');
  assert.equal(frames[0].async, false);
});
test('ex06 · new Foo, Object.<anonymous>, [as alias]', () => {
  assert.equal(frames[2].fn, 'new Foo');
  assert.equal(by('Object.<anonymous>').file, '/app/src/main.js');
  assert.equal(by('fn').file, '/app/src/alias.js');
  assert.equal(by('fn').line, 7);
});
test('ex06 · frame không có tên hàm: fn = null', () => {
  const f = frames.find((x) => x.file === '/app/src/anonymous.js');
  assert.equal(f.fn, null);
  assert.equal(f.line, 5);
  assert.equal(f.col, 5);
});
test('ex06 · vendor (node_modules, cả / lẫn \\)', () => {
  assert.equal(frames.find((f) => f.fn === 'Layer.handle').vendor, true);
  assert.equal(frames.at(-1).vendor, true);
  assert.equal(frames[0].vendor, false);
});
test('ex06 · internal: node:… và <anonymous>; line/col null khi không có vị trí', () => {
  const tick = frames.find((f) => f.fn === 'process.processTicksAndRejections');
  assert.equal(tick.internal, true);
  assert.equal(tick.file, 'node:internal/process/task_queues');
  assert.equal(tick.line, 105);
  const map = frames.find((f) => f.fn === 'Array.map');
  assert.equal(map.internal, true);
  assert.equal(map.line, null);
  assert.equal(map.col, null);
  assert.equal(frames[0].internal, false);
});
test('ex06 · stack rỗng → []', () => {
  assert.deepEqual(parseStack(''), []);
  assert.deepEqual(parseStack('Error: chỉ có message'), []);
});
test('ex06 · parse stack thật của Error', () => {
  const real = parseStack(new Error('x').stack);
  assert.ok(real.length > 0);
  assert.ok(real.every((f) => typeof f.file === 'string'));
  assert.ok(real.some((f) => !f.internal && !f.vendor));
});

test('ex06 · errorChain: theo cause', () => {
  const e = new Error('lớp 1', { cause: Object.assign(new TypeError('lớp 2', { cause: new RangeError('lớp 3') }), { code: 'E2' }) });
  assert.deepEqual(errorChain(e), [
    { name: 'Error', message: 'lớp 1', depth: 0 },
    { name: 'TypeError', message: 'lớp 2', code: 'E2', depth: 1 },
    { name: 'RangeError', message: 'lớp 3', depth: 2 },
  ]);
});
test('ex06 · errorChain: AggregateError → từng phần tử errors sau chính nó', () => {
  const agg = new AggregateError([new Error('a', { cause: new Error('a-gốc') }), new Error('b')], 'nhiều lỗi');
  assert.deepEqual(errorChain(agg).map((x) => [x.message, x.depth]), [['nhiều lỗi', 0], ['a', 1], ['a-gốc', 2], ['b', 1]]);
});
test('ex06 · errorChain: chống vòng và giới hạn 10 tầng', () => {
  const a = new Error('a');
  const b = new Error('b', { cause: a });
  a.cause = b;
  assert.deepEqual(errorChain(a).map((x) => x.message), ['a', 'b']);
  let deep = new Error('đáy');
  for (let i = 0; i < 30; i++) deep = new Error(`l${i}`, { cause: deep });
  assert.ok(errorChain(deep).length <= 11);
});
test('ex06 · errorChain: cause không phải Error', () => {
  const e = new Error('x', { cause: 'chuỗi lạ' });
  assert.deepEqual(errorChain(e), [
    { name: 'Error', message: 'x', depth: 0 },
    { name: 'NonError', message: 'chuỗi lạ', depth: 1 },
  ]);
});
test('ex06 · errorChain: chỉ một lỗi', () => {
  assert.deepEqual(errorChain(new Error('một')), [{ name: 'Error', message: 'một', depth: 0 }]);
});

test('ex06 · firstAppFrame bỏ internal và vendor', () => {
  const e = { stack: 'Error\n    at x (node:internal/a:1:1)\n    at y (/app/node_modules/lib/i.js:2:2)\n    at z (/app/src/svc.js:3:3)' };
  assert.equal(firstAppFrame(e).fn, 'z');
});
test('ex06 · firstAppFrame lọc theo root', () => {
  const e = { stack: 'Error\n    at a (/lib/other/a.js:1:1)\n    at b (/app/src/b.js:2:2)' };
  assert.equal(firstAppFrame(e, { root: '/app' }).fn, 'b');
  assert.equal(firstAppFrame(e, { root: '/khong-co' }), null);
});
test('ex06 · firstAppFrame: không có frame hợp lệ → null; thiếu stack → null', () => {
  assert.equal(firstAppFrame({ stack: 'Error\n    at x (node:fs:1:1)' }), null);
  assert.equal(firstAppFrame({}), null);
});
