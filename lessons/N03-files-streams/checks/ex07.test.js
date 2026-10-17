import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Writable } from 'node:stream';
import { exportOrdersCsv } from '../answers/ex07.js';

function collector({ delayMs = 0 } = {}) {
  let text = '';
  let maxBuffered = 0;
  const w = new Writable({
    write(chunk, _enc, cb) {
      maxBuffered = Math.max(maxBuffered, w.writableLength);
      text += chunk.toString();
      if (delayMs) setTimeout(cb, delayMs); else setImmediate(cb);
    },
  });
  return { w, text: () => text, maxBuffered: () => maxBuffered };
}

test('ex07 · header + dòng, total 2 chữ số thập phân', async () => {
  const c = collector();
  await exportOrdersCsv([{ id: 1, user: 'An', total: 12.5, note: 'ok' }, { id: 2, user: 'Bình', total: 3, note: null }], c.w);
  assert.equal(c.text(), 'id,user,total,note\n1,An,12.50,ok\n2,Bình,3.00,\n');
});
test('ex07 · escape: dấu phẩy, ngoặc kép, xuống dòng, \\r', async () => {
  const c = collector();
  await exportOrdersCsv([{ id: 7, user: 'Lê, Văn', total: 1, note: 'nói "xin chào"\nrồi đi\r' }], c.w);
  assert.equal(c.text(), 'id,user,total,note\n7,"Lê, Văn",1.00,"nói ""xin chào""\nrồi đi\r"\n');
});
test('ex07 · note undefined → trống', async () => {
  const c = collector();
  await exportOrdersCsv([{ id: 1, user: 'x', total: 0 }], c.w);
  assert.equal(c.text(), 'id,user,total,note\n1,x,0.00,\n');
});
test('ex07 · không có dòng nào → chỉ header', async () => {
  const c = collector();
  await exportOrdersCsv([], c.w);
  assert.equal(c.text(), 'id,user,total,note\n');
});
test('ex07 · nhận async iterable', async () => {
  const c = collector();
  async function* rows() { for (let i = 1; i <= 3; i++) yield { id: i, user: `u${i}`, total: i, note: '' }; }
  await exportOrdersCsv(rows(), c.w);
  assert.equal(c.text().split('\n').length, 5); // header + 3 + dòng trống cuối
});
test('ex07 · 300 000 dòng, sink chậm: buffer chờ của sink không vượt 1MB (có backpressure)', async () => {
  const c = collector({ delayMs: 0 });
  function* rows() { for (let i = 0; i < 300_000; i++) yield { id: i, user: `user-${i}`, total: i / 7, note: i % 100 === 0 ? 'a,b' : '' }; }
  await exportOrdersCsv(rows(), c.w);
  assert.ok(c.maxBuffered() < 1024 * 1024, `buffer tối đa ${c.maxBuffered()} byte`);
  assert.equal(c.text().split('\n').length - 2, 300_000);
});
test('ex07 · generator ném lỗi giữa chừng → reject với lỗi đó', async () => {
  const c = collector();
  function* rows() { yield { id: 1, user: 'a', total: 1 }; throw new Error('DB mất kết nối'); }
  await assert.rejects(exportOrdersCsv(rows(), c.w), /DB mất kết nối/);
});
test('ex07 · sink lỗi → reject', async () => {
  const w = new Writable({ write(_c, _e, cb) { cb(new Error('client ngắt kết nối')); } });
  await assert.rejects(exportOrdersCsv([{ id: 1, user: 'a', total: 1 }], w), /client ngắt kết nối/);
});
