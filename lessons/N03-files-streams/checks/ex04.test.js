import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createCsvParser } from '../answers/ex04.js';

/** Chia `data` (Buffer) thành chunk theo danh sách kích thước, lặp lại kích thước cuối. */
async function parse(data, sizes = [1 << 20]) {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
  const chunks = [];
  let i = 0;
  for (let k = 0; i < buf.length; k++) {
    const size = sizes[Math.min(k, sizes.length - 1)];
    chunks.push(buf.subarray(i, i + size));
    i += size;
  }
  const out = [];
  await pipeline(Readable.from(chunks, { objectMode: false }), createCsvParser(), async function (source) {
    for await (const row of source) out.push(row);
  });
  return out;
}

const CSV = 'id,name,note\n1,An,"hello, world"\n2,"Bình ""Bin""","dòng 1\ndòng 2"\n3,Chi,\n';
const EXPECTED = [
  { id: '1', name: 'An', note: 'hello, world' },
  { id: '2', name: 'Bình "Bin"', note: 'dòng 1\ndòng 2' },
  { id: '3', name: 'Chi', note: '' },
];

test('ex04 · parse cơ bản, mọi giá trị là chuỗi', async () => {
  assert.deepEqual(await parse('a,b\n1,2\n3,4\n'), [{ a: '1', b: '2' }, { a: '3', b: '4' }]);
});
test('ex04 · ngoặc kép: dấu phẩy, xuống dòng, "" trong trường', async () => {
  assert.deepEqual(await parse(CSV), EXPECTED);
});
test('ex04 · đúng với MỌI cách chia chunk (1 byte, 2, 3, 7 byte...)', async () => {
  for (const size of [1, 2, 3, 5, 7, 11, 64]) {
    assert.deepEqual(await parse(CSV, [size]), EXPECTED, `chunk ${size} byte`);
  }
});
test('ex04 · chunk cắt giữa ký tự UTF-8 nhiều byte', async () => {
  const rows = await parse('tên,ghi chú\nĐặng Thị Ánh,"Hà Nội — Việt Nam ✓"\n', [1]);
  assert.deepEqual(rows, [{ 'tên': 'Đặng Thị Ánh', 'ghi chú': 'Hà Nội — Việt Nam ✓' }]);
});
test('ex04 · CRLF', async () => {
  assert.deepEqual(await parse('a,b\r\n1,2\r\n3,"x\r\ny"\r\n'), [{ a: '1', b: '2' }, { a: '3', b: 'x\ny'.replace('\n', '\r\n') }]);
});
test('ex04 · dòng cuối không có xuống dòng vẫn được phát', async () => {
  assert.deepEqual(await parse('a,b\n1,2'), [{ a: '1', b: '2' }]);
  assert.deepEqual(await parse('a,b\n1,"2"'), [{ a: '1', b: '2' }]);
});
test('ex04 · bỏ qua dòng trống', async () => {
  assert.deepEqual(await parse('a,b\n\n1,2\n\n\n3,4\n'), [{ a: '1', b: '2' }, { a: '3', b: '4' }]);
});
test('ex04 · chỉ có header hoặc rỗng → không phát gì', async () => {
  assert.deepEqual(await parse('a,b\n'), []);
  assert.deepEqual(await parse(''), []);
});
test('ex04 · dòng thiếu trường → điền chuỗi rỗng', async () => {
  assert.deepEqual(await parse('a,b,c\n1,2\n'), [{ a: '1', b: '2', c: '' }]);
});
test('ex04 · dòng thừa trường → lỗi nêu số thứ tự dòng dữ liệu', async () => {
  await assert.rejects(parse('a,b\n1,2\n3,4,5\n'), { message: 'Row 2 has more fields than header' });
});
test('ex04 · trường rỗng trong ngoặc kép "" khác với thiếu', async () => {
  assert.deepEqual(await parse('a,b\n"",x\n'), [{ a: '', b: 'x' }]);
});
test('ex04 · stream object: output là object, không phải Buffer', async () => {
  const [row] = await parse('a\n1\n');
  assert.equal(typeof row, 'object');
  assert.ok(!Buffer.isBuffer(row));
});
