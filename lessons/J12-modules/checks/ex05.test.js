import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadPlugins } from '../answers/ex05.js';

const base = new URL('../fixtures/plugins/', import.meta.url);

test('ex05 · nạp nhiều plugin', async () => {
  const plugins = await loadPlugins(['hello', 'metrics'], base);
  assert.ok(plugins instanceof Map);
  assert.deepEqual([...plugins.keys()], ['hello', 'metrics']);
  const app = { routes: [] };
  for (const p of plugins.values()) p.register(app);
  assert.deepEqual(app.routes, ['/hello', '/metrics']);
});
test('ex05 · chặn path traversal', async () => {
  for (const name of ['../secret', 'Hello', 'a/b', '', 'hello.js']) {
    await assert.rejects(loadPlugins([name], base), (e) => e instanceof Error && !(e.leaked), name);
  }
});
test('ex05 · không tồn tại → lỗi có tên plugin và cause', async () => {
  await assert.rejects(loadPlugins(['nope'], base), (e) => e.message.includes('nope') && e.cause !== undefined);
});
test('ex05 · thiếu register → TypeError', async () => {
  await assert.rejects(loadPlugins(['broken'], base), TypeError);
});
