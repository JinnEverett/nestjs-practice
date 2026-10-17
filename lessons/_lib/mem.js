// Helper đo bộ nhớ / dựng file tạm cho test Tier N.
import { mkdtemp, rm } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

/** Chạy fn, trả mức RSS tăng thêm lớn nhất (byte) so với lúc bắt đầu. */
export async function peakRssDelta(fn) {
  const base = process.memoryUsage.rss();
  let peak = base;
  const timer = setInterval(() => { peak = Math.max(peak, process.memoryUsage.rss()); }, 2);
  try {
    await fn();
  } finally {
    clearInterval(timer);
  }
  peak = Math.max(peak, process.memoryUsage.rss());
  return peak - base;
}

export const MB = 1024 * 1024;

/** Thư mục tạm; gọi cleanup() sau khi xong. */
export async function tempDir(prefix = 'nest-lesson-') {
  const dir = await mkdtemp(join(tmpdir(), prefix));
  return { dir, cleanup: () => rm(dir, { recursive: true, force: true }) };
}

/** Ghi file lớn bằng cách lặp lại một khối: writeRepeated(path, block, times). */
export async function writeRepeated(path, block, times) {
  const out = createWriteStream(path);
  for (let i = 0; i < times; i++) {
    if (!out.write(block)) await once(out, 'drain');
  }
  out.end();
  await once(out, 'finish');
}
