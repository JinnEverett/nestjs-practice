import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const needsQuote = /[",\r\n]/;
const cell = (value) => {
  const s = value == null ? '' : String(value);
  return needsQuote.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

async function* csvChunks(rows) {
  yield 'id,user,total,note\n';
  let batch = '';
  for await (const r of rows) {
    batch += `${cell(r.id)},${cell(r.user)},${Number(r.total).toFixed(2)},${cell(r.note)}\n`;
    if (batch.length >= 16 * 1024) {
      yield batch;
      batch = '';
    }
  }
  if (batch) yield batch;
}

export function exportOrdersCsv(rows, out) {
  return pipeline(Readable.from(csvChunks(rows)), out);
}
