import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readConfig, ConfigError } from '../answers/ex02.js';

const schema = {
  PORT: { type: 'int', default: 3000, min: 1, max: 65535 },
  NODE_ENV: { type: 'enum', values: ['development', 'test', 'production'], default: 'development' },
  DATABASE_URL: { type: 'url', required: true },
  JWT_SECRET: { type: 'string', required: true },
  DEBUG: { type: 'bool', default: false },
  REDIS_URL: { type: 'url' },
};
const good = { DATABASE_URL: 'postgres://u:pw@localhost:5434/shop', JWT_SECRET: 's3cr3t' };

test('ex02 · hợp lệ: ép kiểu, dùng default, khóa vắng không có trong kết quả', () => {
  const c = readConfig({ ...good, PORT: '8080', DEBUG: 'yes' }, schema);
  assert.equal(c.PORT, 8080);
  assert.equal(c.DEBUG, true);
  assert.equal(c.NODE_ENV, 'development');
  assert.equal(c.JWT_SECRET, 's3cr3t');
  assert.equal(Object.hasOwn(c, 'REDIS_URL'), false);
});
test('ex02 · mặc định khi không truyền', () => {
  const c = readConfig(good, schema);
  assert.equal(c.PORT, 3000);
  assert.equal(c.DEBUG, false);
});
test('ex02 · chuỗi rỗng / toàn khoảng trắng coi như thiếu', () => {
  const c = readConfig({ ...good, PORT: '   ', NODE_ENV: '' }, schema);
  assert.equal(c.PORT, 3000);
  assert.equal(c.NODE_ENV, 'development');
  assert.throws(() => readConfig({ ...good, JWT_SECRET: '' }, schema), ConfigError);
});
test('ex02 · bool: nhiều cách viết, không phân biệt hoa thường; "false" KHÔNG truthy', () => {
  for (const t of ['true', '1', 'YES', 'On']) assert.equal(readConfig({ ...good, DEBUG: t }, schema).DEBUG, true, t);
  for (const f of ['false', '0', 'No', 'OFF']) assert.equal(readConfig({ ...good, DEBUG: f }, schema).DEBUG, false, f);
  assert.throws(() => readConfig({ ...good, DEBUG: 'maybe' }, schema), ConfigError);
});
test('ex02 · int: chỉ số nguyên; min/max; không nhận "3000abc", "1e3", "3.5"', () => {
  for (const bad of ['abc', '3000abc', '1e3', '3.5', '0', '70000', '-1']) {
    assert.throws(() => readConfig({ ...good, PORT: bad }, schema), ConfigError, bad);
  }
  assert.equal(readConfig({ ...good, PORT: ' 65535 ' }, schema).PORT, 65535);
});
test('ex02 · enum và url', () => {
  assert.throws(() => readConfig({ ...good, NODE_ENV: 'staging' }, schema), ConfigError);
  assert.throws(() => readConfig({ ...good, DATABASE_URL: 'không phải url' }, schema), ConfigError);
  assert.equal(readConfig({ ...good, NODE_ENV: 'production' }, schema).NODE_ENV, 'production');
});
test('ex02 · gom MỌI lỗi, ConfigError.errors và message liệt kê tên biến', () => {
  try {
    readConfig({ PORT: 'x', NODE_ENV: 'weird' }, schema);
    assert.fail('phải ném');
  } catch (e) {
    assert.ok(e instanceof ConfigError);
    assert.ok(e instanceof Error);
    assert.equal(e.name, 'ConfigError');
    assert.deepEqual(e.errors.map((x) => x.key).sort(), ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV', 'PORT']);
    for (const x of e.errors) assert.equal(typeof x.message, 'string');
    assert.match(e.message, /^Invalid configuration: /);
    for (const k of ['PORT', 'NODE_ENV', 'DATABASE_URL', 'JWT_SECRET']) assert.ok(e.message.includes(k), k);
  }
});
test('ex02 · KHÔNG lộ giá trị biến trong message (secret)', () => {
  const secret = 'postgres://admin:SuperSecret123@db/prod';
  try {
    readConfig({ ...good, DATABASE_URL: 'not-a-url-SuperSecret123', JWT_SECRET: 'abc', PORT: 'SuperSecret123' }, schema);
    assert.fail('phải ném');
  } catch (e) {
    const all = e.message + JSON.stringify(e.errors);
    assert.ok(!all.includes('SuperSecret123'), all);
    assert.ok(!all.includes(secret));
  }
});
test('ex02 · bỏ qua biến không có trong schema; không mutate env', () => {
  const env = Object.freeze({ ...good, RANDOM_OTHER: 'x' });
  const c = readConfig(env, schema);
  assert.equal(Object.hasOwn(c, 'RANDOM_OTHER'), false);
});
