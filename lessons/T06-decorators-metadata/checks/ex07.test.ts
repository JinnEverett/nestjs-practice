import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Retry, Timeout } from '../answers/ex07.js';

const never = () => new Promise<never>(() => {});

class Client {
  attempts = 0;

  @Retry({ times: 2 })
  @Timeout(30)
  async perAttemptTimeout() {
    this.attempts++;
    if (this.attempts < 3) return never();
    return 'ok';
  }

  @Timeout(60)
  @Retry({ times: 5, delayMs: 20 })
  async totalTimeout() {
    this.attempts++;
    throw new Error('503');
  }

  @Retry({ times: 2 })
  async flaky() {
    this.attempts++;
    if (this.attempts === 1) throw new Error('blip');
    return this.attempts;
  }

  @Retry({ times: 1 })
  async alwaysFails() {
    this.attempts++;
    throw new Error(`fail ${this.attempts}`);
  }
}

test('ex07 · retry giữ this', async () => {
  const c = new Client();
  assert.equal(await c.flaky(), 2);
});
test('ex07 · hết lượt → lỗi lần cuối', async () => {
  const c = new Client();
  await assert.rejects(c.alwaysFails(), /fail 2/);
  assert.equal(c.attempts, 2);
});
test('ex07 · @Retry @Timeout: timeout từng lần thử', async () => {
  const c = new Client();
  assert.equal(await c.perAttemptTimeout(), 'ok');
  assert.equal(c.attempts, 3);
});
test('ex07 · @Timeout @Retry: timeout toàn bộ', async () => {
  const c = new Client();
  await assert.rejects(c.totalTimeout(), (e: unknown) => e instanceof Error && e.name === 'TimeoutError');
  assert.ok(c.attempts >= 2 && c.attempts <= 4, `attempts=${c.attempts}`);
});
