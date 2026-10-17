import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNotifier } from '../answers/ex05.js';

function _typeTests() {
  // @ts-expect-error webhook thiếu url
  createNotifier({ type: 'webhook' });
  // @ts-expect-error type lạ
  createNotifier({ type: 'pigeon' });
}

test('ex05 · console', async () => assert.equal(await createNotifier({ type: 'console', prefix: '[DEV]' }).send('a', 'hi'), '[DEV] a: hi'));
test('ex05 · memory đếm riêng từng notifier', async () => {
  const a = createNotifier({ type: 'memory' });
  const b = createNotifier({ type: 'memory' });
  assert.equal(await a.send('x', '1'), 'stored #1');
  assert.equal(await a.send('x', '2'), 'stored #2');
  assert.equal(await b.send('x', '1'), 'stored #1');
});
test('ex05 · webhook', async () => assert.equal(await createNotifier({ type: 'webhook', url: 'https://hook' }).send('a', 'b'), 'POST https://hook'));
