import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { UPLOAD_DIR } from '../../src/uploads/upload.tokens';
import { createTestApp, http } from './_kit';
import { KEY } from './_fixtures';

const filler = (n: number, seed = 7): Buffer => {
  const b = Buffer.alloc(n);
  let x = seed;
  for (let i = 0; i < n; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    b[i] = x & 0xff;
  }
  return b;
};
export const png = (size = 1000, seed = 1): Buffer => Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), filler(Math.max(0, size - 8), seed)]);
export const jpeg = (size = 1000, seed = 2): Buffer => Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), filler(Math.max(0, size - 4), seed)]);
export const webp = (size = 1000, seed = 3): Buffer =>
  Buffer.concat([Buffer.from('RIFF'), Buffer.from([0, 0, 0, 0]), Buffer.from('WEBP'), filler(Math.max(0, size - 12), seed)]);
export const html = (): Buffer => Buffer.from('<html><script>alert(1)</script></html>');

export interface Sandbox {
  app: INestApplication;
  dir: string;
  files(): string[];
  cleanup(): Promise<void>;
}

/** Ứng dụng với thư mục upload tạm riêng cho mỗi bài. */
export async function sandbox(): Promise<Sandbox> {
  const dir = mkdtempSync(join(tmpdir(), 'shop-upload-test-'));
  const app = await createTestApp({ customize: (b) => b.overrideProvider(UPLOAD_DIR).useValue(dir) });
  return {
    app,
    dir,
    files: () => readdirSync(dir),
    cleanup: async () => {
      await app.close();
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

export interface UploadOpts {
  filename?: string;
  contentType?: string;
  field?: string;
  key?: string | null;
}
export function upload(app: INestApplication, id: number | string, data: Buffer, o: UploadOpts = {}) {
  const req = http(app).post(`/v1/products/${id}/image`);
  if (o.key !== null) req.set('x-api-key', o.key ?? KEY);
  return req.attach(o.field ?? 'file', data, { filename: o.filename ?? 'photo.png', contentType: o.contentType ?? 'image/png' });
}

/** Bộ phân tích thân nhị phân cho supertest: .buffer(true).parse(binary) */
export function binary(res: unknown, cb: (err: Error | null, body: Buffer) => void): void {
  const stream = res as NodeJS.ReadableStream;
  const chunks: Buffer[] = [];
  stream.on('data', (c: Buffer) => chunks.push(c));
  stream.on('end', () => cb(null, Buffer.concat(chunks)));
}
