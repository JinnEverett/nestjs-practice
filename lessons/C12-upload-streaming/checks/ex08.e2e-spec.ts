import { http } from './_kit';
import { createProduct } from './_fixtures';
import { png, sandbox, Sandbox, upload } from './_img';

describe('C12 ex08 · 🔴 "Pentest: gửi 500 file trong một request"', () => {
  let sb: Sandbox;
  beforeAll(async () => {
    sb = await sandbox();
  });
  afterAll(async () => {
    await sb.cleanup();
  });
  const KEY = 'dev-admin-key';

  it('nhiều file trong một request → 400, không lưu file nào', async () => {
    const p = await createProduct(sb.app);
    const before = sb.files();
    const req = http(sb.app).post(`/v1/products/${p.id}/image`).set('x-api-key', KEY);
    for (let i = 0; i < 5; i++) req.attach('file', png(500, i), { filename: `a${i}.png`, contentType: 'image/png' });
    const res = await req;
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/problem\+json/);
    expect(sb.files()).toEqual(before);
  });

  it('file ở nhiều tên trường khác nhau → 400', async () => {
    const p = await createProduct(sb.app);
    const res = await http(sb.app).post(`/v1/products/${p.id}/image`).set('x-api-key', KEY)
      .attach('file', png(500), { filename: 'a.png', contentType: 'image/png' })
      .attach('other', png(500), { filename: 'b.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });

  it('kèm trường văn bản ngoài file (vd. "role=admin") → 400', async () => {
    const p = await createProduct(sb.app);
    const res = await http(sb.app).post(`/v1/products/${p.id}/image`).set('x-api-key', KEY)
      .field('role', 'admin')
      .attach('file', png(500), { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
  });

  it('gửi JSON thay vì multipart → 400 (không 500)', async () => {
    const p = await createProduct(sb.app);
    const res = await http(sb.app).post(`/v1/products/${p.id}/image`).set('x-api-key', KEY).send({ file: 'abc' });
    expect(res.status).toBe(400);
  });

  it('20 upload song song, mỗi cái 2MB: tất cả thành công và server không chết', async () => {
    const ps = await Promise.all(Array.from({ length: 20 }, () => createProduct(sb.app)));
    const results = await Promise.all(ps.map((p, i) => upload(sb.app, p.id, png(2 * 1024 * 1024, i))));
    expect(results.map((r) => r.status)).toEqual(Array(20).fill(201));
    await http(sb.app).get('/ping').expect(200);
  }, 60_000);

  it('thân multipart cực lớn (12MB) bị cắt: 413 và server vẫn phục vụ tiếp', async () => {
    const p = await createProduct(sb.app);
    const res = await upload(sb.app, p.id, png(12 * 1024 * 1024));
    expect(res.status).toBe(413);
    await http(sb.app).get('/ping').expect(200);
  }, 30_000);
});
