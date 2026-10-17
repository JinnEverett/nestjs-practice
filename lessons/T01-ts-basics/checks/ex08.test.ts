import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { loadConfig, type AppConfig } from '../answers/ex08.js';

type _ret = Expect<Equal<ReturnType<typeof loadConfig>, Readonly<AppConfig>>>;
type _env = Expect<Equal<AppConfig['nodeEnv'], 'development' | 'production' | 'test'>>;

test('ex08 · mặc định', () => {
  assert.deepEqual(loadConfig({ DATABASE_URL: 'pg://x' }), { port: 3000, databaseUrl: 'pg://x', nodeEnv: 'development', corsOrigins: [] });
});
test('ex08 · đầy đủ', () => {
  const c = loadConfig({ PORT: '8080', DATABASE_URL: 'pg://y', NODE_ENV: 'production', CORS_ORIGINS: ' https://a.vn, ,https://b.vn ' });
  assert.deepEqual(c, { port: 8080, databaseUrl: 'pg://y', nodeEnv: 'production', corsOrigins: ['https://a.vn', 'https://b.vn'] });
});
test('ex08 · gom mọi lỗi vào một Error', () => {
  assert.throws(
    () => loadConfig({ PORT: 'abc', NODE_ENV: 'staging' }),
    (e: unknown) => e instanceof Error && ['PORT', 'DATABASE_URL', 'NODE_ENV'].every((k) => e.message.includes(k)),
  );
});
