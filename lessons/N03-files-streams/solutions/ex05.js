import { createReadStream, createWriteStream } from 'node:fs';
import { rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { createGunzip, createGzip } from 'node:zlib';

async function run(src, dest, transform) {
  const out = createWriteStream(dest);
  try {
    await pipeline(createReadStream(src), transform, out);
  } catch (err) {
    out.destroy();
    if (!out.closed) await new Promise((resolve) => out.once('close', resolve)); // Windows: phải đóng fd trước khi xóa
    await rm(dest, { force: true });
    throw err;
  }
}

export const gzipFile = (src, dest) => run(src, dest, createGzip());
export const gunzipFile = (src, dest) => run(src, dest, createGunzip());
