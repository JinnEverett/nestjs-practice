import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Equal, Expect } from '../_lib/types.js';
import { get, type Paths, type PathValue } from '../answers/ex08.js';

interface Config {
  db: { host: string; port: number; pool: { max: number } };
  features: string[];
  startedAt: Date;
}
const config: Config = { db: { host: 'localhost', port: 5434, pool: { max: 10 } }, features: ['a'], startedAt: new Date(0) };

type _p = Expect<Equal<Paths<Config>, 'db' | 'db.host' | 'db.port' | 'db.pool' | 'db.pool.max' | 'features' | 'startedAt'>>;
type _v = Expect<Equal<PathValue<Config, 'db.pool'>, { max: number }>>;
const port = get(config, 'db.port');
type _port = Expect<Equal<typeof port, number>>;

function _typeTests() {
  // @ts-expect-error đường dẫn không tồn tại
  get(config, 'db.user');
  // @ts-expect-error không đi vào trong mảng
  get(config, 'features.length');
}

test('ex08 · get', () => {
  assert.equal(get(config, 'db.port'), 5434);
  assert.equal(get(config, 'db.pool.max'), 10);
  assert.deepEqual(get(config, 'features'), ['a']);
});
