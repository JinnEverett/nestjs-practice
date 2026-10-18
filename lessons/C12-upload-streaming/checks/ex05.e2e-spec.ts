import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { StreamableFile } from '@nestjs/common';
import { http } from './_kit';
import { createProduct } from './_fixtures';
import { binary, png, sandbox, Sandbox, upload } from './_img';

describe('C12 ex05 · tải xuống bằng StreamableFile', () => {
  let sb: Sandbox;
  beforeAll(async () => {
    sb = await sandbox();
  });
  afterAll(async () => {
    await sb.cleanup();
  });

  it('header: Content-Type, Content-Length, ETag, Content-Disposition inline, nosniff', async () => {
    const p = await createProduct(sb.app);
    await upload(sb.app, p.id, png(3000)).expect(201);
    const res = await http(sb.app).get(`/v1/products/${p.id}/image`).buffer(true).parse(binary).expect(200);
    expect(res.headers['content-type']).toMatch(/^image\/png/);
    expect(res.headers['content-length']).toBe('3000');
    expect(res.headers.etag).toMatch(/^(W\/)?"[^"]+"$/);
    expect(res.headers['content-disposition']).toMatch(/^inline/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('ảnh gần 2MB trả về nguyên vẹn từng byte', async () => {
    const p = await createProduct(sb.app);
    const data = png(2 * 1024 * 1024 - 5, 77);
    await upload(sb.app, p.id, data).expect(201);
    const res = await http(sb.app).get(`/v1/products/${p.id}/image`).buffer(true).parse(binary).expect(200);
    expect(createHash('sha1').update(res.body as Buffer).digest('hex')).toBe(createHash('sha1').update(data).digest('hex'));
  });

  it('If-None-Match khớp → 304 không body; thay ảnh thì ETag đổi', async () => {
    const p = await createProduct(sb.app);
    await upload(sb.app, p.id, png(1000, 1)).expect(201);
    const first = await http(sb.app).get(`/v1/products/${p.id}/image`).buffer(true).parse(binary).expect(200);
    const etag = first.headers.etag as string;
    const again = await http(sb.app).get(`/v1/products/${p.id}/image`).set('If-None-Match', etag).expect(304);
    expect(again.text ?? '').toBe('');
    await new Promise((r) => setTimeout(r, 15));
    await upload(sb.app, p.id, png(1500, 2)).expect(201);
    const changed = await http(sb.app).get(`/v1/products/${p.id}/image`).set('If-None-Match', etag).buffer(true).parse(binary).expect(200);
    expect(changed.headers.etag).not.toBe(etag);
  });

  it('(giáo dục) StreamableFile bọc được ReadStream và có thể gắn type/length/disposition', () => {
    const f = new StreamableFile(createReadStream(__filename), { type: 'text/plain', length: 1, disposition: 'inline' });
    expect(f.getHeaders()).toMatchObject({ type: 'text/plain', length: 1, disposition: 'inline' });
    f.getStream().destroy();
  });

  it('lỗi dùng cùng định dạng problem+json (404 không có ảnh)', async () => {
    const p = await createProduct(sb.app);
    const res = await http(sb.app).get(`/v1/products/${p.id}/image`).expect(404);
    expect(res.headers['content-type']).toMatch(/problem\+json/);
  });
});
