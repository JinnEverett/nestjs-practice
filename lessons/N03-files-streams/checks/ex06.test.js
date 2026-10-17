import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { writeAll } from '../answers/ex06.js';

function slowSink({ hwm = 10, delayMs = 1, failAt = -1 } = {}) {
  const received = [];
  let maxBuffered = 0;
  let calls = 0;
  const w = new Writable({
    highWaterMark: hwm,
    write(chunk, _enc, cb) {
      const idx = calls++;
      setTimeout(() => {
        if (idx === failAt) return cb(new Error('đĩa đầy'));
        received.push(chunk.toString());
        cb();
      }, delayMs);
    },
  });
  const origWrite = w.write.bind(w);
  w.write = (...args) => {
    const r = origWrite(...args);
    maxBuffered = Math.max(maxBuffered, w.writableLength);
    return r;
  };
  return { w, received, stats: () => ({ maxBuffered }) };
}

test('ex06 · ghi đủ dữ liệu theo đúng thứ tự và chỉ resolve sau khi finish', async () => {
  const { w, received } = slowSink();
  const chunks = Array.from({ length: 50 }, (_, i) => String(i % 10).repeat(5));
  await writeAll(w, chunks);
  assert.equal(w.writableFinished, true);
  assert.equal(received.join(''), chunks.join(''));
});
test('ex06 · tôn trọng backpressure: buffer không vượt hwm + 1 chunk', async () => {
  const { w, stats } = slowSink({ hwm: 10 });
  await writeAll(w, Array.from({ length: 200 }, () => 'abcde')); // chunk 5 byte
  assert.ok(stats().maxBuffered <= 10 + 5, `buffer lên tới ${stats().maxBuffered} byte`);
});
test('ex06 · nhận cả iterable không phải mảng (generator)', async () => {
  const { w, received } = slowSink({ hwm: 4 });
  function* gen() { yield 'a'; yield Buffer.from('b'); yield 'c'; }
  await writeAll(w, gen());
  assert.equal(received.join(''), 'abc');
});
test('ex06 · iterable rỗng → vẫn end() và resolve', async () => {
  const { w } = slowSink();
  await writeAll(w, []);
  assert.equal(w.writableFinished, true);
});
test('ex06 · writable lỗi giữa chừng → reject đúng lỗi, không treo', async () => {
  const { w } = slowSink({ hwm: 5, failAt: 3 });
  const p = writeAll(w, Array.from({ length: 30 }, () => 'abcde'));
  await assert.rejects(Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('TREO')), 2000))]), /đĩa đầy/);
});
test('ex06 · không để lại unhandledRejection khi lỗi', async () => {
  const errors = [];
  const onErr = (e) => errors.push(e);
  process.on('unhandledRejection', onErr);
  const { w } = slowSink({ hwm: 5, failAt: 1 });
  await assert.rejects(writeAll(w, Array.from({ length: 30 }, () => 'abcde')), /đĩa đầy/);
  await new Promise((r) => setTimeout(r, 50));
  process.off('unhandledRejection', onErr);
  assert.deepEqual(errors, []);
});
