import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLogger } from '../answers/ex04.js';

const FIXED = Date.parse('2026-10-17T08:00:00.000Z');
function make(options = {}) {
  const lines = [];
  const log = createLogger({ sink: (l) => lines.push(l), now: () => FIXED, ...options });
  return { log, lines, last: () => JSON.parse(lines.at(-1)) };
}

test('ex04 · mỗi lần ghi gọi sink với một chuỗi JSON: level, time ISO, msg', () => {
  const { log, lines, last } = make();
  log.info('xin chào');
  assert.equal(lines.length, 1);
  assert.equal(typeof lines[0], 'string');
  assert.deepEqual(last(), { level: 'info', time: '2026-10-17T08:00:00.000Z', msg: 'xin chào' });
  assert.ok(!lines[0].includes('\n'), 'phải là một dòng');
});
test('ex04 · fields và base được trải phẳng; fields không ghi đè level/time/msg', () => {
  const { log, last } = make({ base: { service: 'shop-api' } });
  log.warn('x', { orderId: 42, level: 'hack', time: 'hack', msg: 'hack', service: 'ghi-đè' });
  const e = last();
  assert.equal(e.level, 'warn');
  assert.equal(e.time, '2026-10-17T08:00:00.000Z');
  assert.equal(e.msg, 'x');
  assert.equal(e.orderId, 42);
  assert.equal(e.service, 'ghi-đè', 'fields ghi đè base');
});
test('ex04 · lọc theo level, isLevelEnabled', () => {
  const { log, lines } = make({ level: 'warn' });
  log.trace('a'); log.debug('b'); log.info('c');
  assert.equal(lines.length, 0);
  log.warn('d'); log.error('e'); log.fatal('f');
  assert.equal(lines.length, 3);
  assert.equal(log.isLevelEnabled('info'), false);
  assert.equal(log.isLevelEnabled('error'), true);
});
test('ex04 · mức mặc định là info', () => {
  const { log, lines } = make();
  log.debug('bị bỏ');
  log.info('ghi');
  assert.equal(lines.length, 1);
});
test('ex04 · child gộp bindings, dùng chung sink; không ảnh hưởng logger cha', () => {
  const { log, lines, last } = make({ base: { service: 'api' } });
  const child = log.child({ requestId: 'r1' });
  child.info('con');
  assert.deepEqual({ r: last().requestId, s: last().service }, { r: 'r1', s: 'api' });
  log.info('cha');
  assert.equal(last().requestId, undefined);
  assert.equal(lines.length, 2);
  const grand = child.child({ userId: 7 });
  grand.info('cháu');
  assert.deepEqual({ r: last().requestId, u: last().userId }, { r: 'r1', u: 7 });
});
test('ex04 · Error được serialize: type, message, stack, code, cause (đệ quy)', () => {
  const { log, last } = make();
  const cause = Object.assign(new Error('connection refused'), { code: 'ECONNREFUSED' });
  const err = new TypeError('query failed', { cause });
  log.error('db lỗi', { err });
  const e = last().err;
  assert.equal(e.type, 'TypeError');
  assert.equal(e.message, 'query failed');
  assert.equal(typeof e.stack, 'string');
  assert.equal(e.cause.type, 'Error');
  assert.equal(e.cause.message, 'connection refused');
  assert.equal(e.cause.code, 'ECONNREFUSED');
});
test('ex04 · truyền thẳng Error làm fields → {err}', () => {
  const { log, last } = make();
  log.error('lỗi', new Error('trần'));
  assert.equal(last().err.message, 'trần');
});
test('ex04 · Error lồng sâu trong object/mảng cũng được serialize', () => {
  const { log, last } = make();
  log.error('x', { results: [{ ok: false, error: new Error('con') }] });
  assert.equal(last().results[0].error.message, 'con');
});
test('ex04 · redact mặc định: mọi độ sâu, không phân biệt hoa thường, trong mảng', () => {
  const { log, last } = make();
  log.info('login', {
    user: 'an', password: 'p1', Authorization: 'Bearer abc',
    nested: { deep: { Token: 't', ok: 1 } },
    list: [{ apiKey: 'k', API_KEY: 'k2', keep: 'y' }],
    headers: { cookie: 'sid=1', 'x-ok': 'z' },
  });
  const e = last();
  assert.equal(e.user, 'an');
  assert.equal(e.password, '[REDACTED]');
  assert.equal(e.Authorization, '[REDACTED]');
  assert.equal(e.nested.deep.Token, '[REDACTED]');
  assert.equal(e.nested.deep.ok, 1);
  assert.equal(e.list[0].apiKey, '[REDACTED]');
  assert.equal(e.list[0].API_KEY, '[REDACTED]');
  assert.equal(e.list[0].keep, 'y');
  assert.equal(e.headers.cookie, '[REDACTED]');
  assert.equal(e.headers['x-ok'], 'z');
  assert.ok(!JSON.stringify(e).includes('Bearer abc'));
});
test('ex04 · redact tùy biến thêm khóa', () => {
  const { log, last } = make({ redact: ['cardNumber'] });
  log.info('x', { cardNumber: '4111', password: 'p' });
  assert.equal(last().cardNumber, '[REDACTED]');
  assert.equal(last().password, '[REDACTED]');
});
test('ex04 · child giữ cấu hình redact', () => {
  const { log, last } = make({ redact: ['pin'] });
  log.child({ a: 1 }).info('x', { pin: '1234' });
  assert.equal(last().pin, '[REDACTED]');
});
test('ex04 · vòng tham chiếu → "[Circular]", không ném lỗi', () => {
  const { log, last } = make();
  const a = { name: 'a' };
  a.self = a;
  a.list = [a];
  assert.doesNotThrow(() => log.info('vòng', { a }));
  assert.equal(last().a.self, '[Circular]');
  assert.equal(last().a.list[0], '[Circular]');
});
test('ex04 · cùng một object xuất hiện hai lần (không phải vòng) vẫn in đủ', () => {
  const { log, last } = make();
  const shared = { v: 1 };
  log.info('x', { a: shared, b: shared });
  assert.deepEqual(last().a, { v: 1 });
  assert.deepEqual(last().b, { v: 1 });
});
test('ex04 · BigInt → chuỗi; Date → ISO; undefined bị bỏ; hàm bị bỏ', () => {
  const { log, last } = make();
  log.info('kiểu', { big: 12345678901234567890n, d: new Date('2026-01-02T03:04:05.000Z'), u: undefined, f: () => 1, n: null, arr: [undefined, 1] });
  const e = last();
  assert.equal(e.big, '12345678901234567890');
  assert.equal(e.d, '2026-01-02T03:04:05.000Z');
  assert.equal('u' in e, false);
  assert.equal('f' in e, false);
  assert.equal(e.n, null);
  assert.deepEqual(e.arr, [null, 1]);
});
test('ex04 · không mutate fields đầu vào', () => {
  const { log } = make();
  const fields = { password: 'p', nested: { token: 't' } };
  log.info('x', fields);
  assert.equal(fields.password, 'p');
  assert.equal(fields.nested.token, 't');
});
test('ex04 · time lấy từ now() mỗi lần ghi', () => {
  let t = FIXED;
  const lines = [];
  const log = createLogger({ sink: (l) => lines.push(JSON.parse(l)), now: () => t });
  log.info('a');
  t += 1500;
  log.info('b');
  assert.equal(lines[1].time, '2026-10-17T08:00:01.500Z');
});
