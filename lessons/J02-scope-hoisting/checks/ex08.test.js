import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createConfig } from '../answers/ex08.js';

test('ex08 · mặc định', () => {
  assert.deepEqual({ ...createConfig({ DATABASE_URL: 'postgres://x' }) }, {
    port: 3000,
    databaseUrl: 'postgres://x',
    nodeEnv: 'development',
    isProduction: false,
  });
});
test('ex08 · đọc đủ biến', () => {
  const c = createConfig({ PORT: '8080', DATABASE_URL: 'postgres://y', NODE_ENV: 'production' });
  assert.equal(c.port, 8080);
  assert.equal(c.nodeEnv, 'production');
  assert.equal(c.isProduction, true);
});
test('ex08 · thiếu hoặc rỗng DATABASE_URL → lỗi', () => {
  assert.throws(() => createConfig({}), /DATABASE_URL/);
  assert.throws(() => createConfig({ DATABASE_URL: '' }), /DATABASE_URL/);
});
test('ex08 · PORT sai → lỗi', () => {
  for (const p of ['abc', '0', '70000', '80.5', '12abc']) {
    assert.throws(() => createConfig({ PORT: p, DATABASE_URL: 'x' }), /PORT/, p);
  }
});
test('ex08 · object bị đóng băng', () => {
  const c = createConfig({ DATABASE_URL: 'x' });
  assert.equal(Object.isFrozen(c), true);
  assert.throws(() => {
    c.port = 1;
  }, TypeError);
});
test('ex08 · không đọc process.env', () => {
  process.env.DATABASE_URL = 'from-process-env';
  try {
    assert.throws(() => createConfig({}), /DATABASE_URL/);
  } finally {
    delete process.env.DATABASE_URL;
  }
});
