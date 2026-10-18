import { createHash } from 'node:crypto';
import { http } from './_kit';
import { createProduct } from './_fixtures';
import { binary, png, sandbox, Sandbox, upload } from './_img';

describe('C12 ex01 · tải ảnh lên và tải về', () => {
  let sb: Sandbox;
  beforeAll(async () => {
    sb = await sandbox();
  });
  afterAll(async () => {
    await sb.cleanup();
  });

  it('POST /v1/products/:id/image → 201 + Location + mô tả ảnh (không lộ tên file của client)', async () => {
    const p = await createProduct(sb.app);
    const data = png(5000);
    const res = await upload(sb.app, p.id, data, { filename: 'anh-cua-toi.png' }).expect(201);
    expect(res.headers.location).toBe(`/v1/products/${p.id}/image`);
    expect(res.body).toEqual({ productId: p.id, imageUrl: `/v1/products/${p.id}/image`, contentType: 'image/png', size: 5000 });
    expect(JSON.stringify(res.body)).not.toContain('anh-cua-toi');
  });

  it('GET trả đúng từng byte với Content-Type và Content-Length đúng', async () => {
    const p = await createProduct(sb.app);
    const data = png(12345, 9);
    await upload(sb.app, p.id, data).expect(201);
    const res = await http(sb.app).get(`/v1/products/${p.id}/image`).buffer(true).parse(binary).expect(200);
    expect(res.headers['content-type']).toMatch(/^image\/png/);
    expect(Number(res.headers['content-length'])).toBe(12345);
    expect(createHash('sha256').update(res.body as Buffer).digest('hex')).toBe(createHash('sha256').update(data).digest('hex'));
  });

  it('cần X-Api-Key để tải lên (401), nhưng xem ảnh thì công khai', async () => {
    const p = await createProduct(sb.app);
    await upload(sb.app, p.id, png(), { key: null }).expect(401);
    await upload(sb.app, p.id, png()).expect(201);
    await http(sb.app).get(`/v1/products/${p.id}/image`).expect(200);
  });

  it('sản phẩm không tồn tại → 404; sản phẩm chưa có ảnh → 404; id sai → 400', async () => {
    const p = await createProduct(sb.app);
    expect((await upload(sb.app, 999999, png()).expect(404)).body.type).toBe('urn:shop:error:product-not-found');
    await http(sb.app).get(`/v1/products/${p.id}/image`).expect(404);
    await http(sb.app).get('/v1/products/999999/image').expect(404);
    await upload(sb.app, 0, png()).expect(400);
  });

  it('không gửi file, hoặc gửi sai tên trường → 400', async () => {
    const p = await createProduct(sb.app);
    await http(sb.app).post(`/v1/products/${p.id}/image`).set('x-api-key', 'dev-admin-key').expect(400);
    await upload(sb.app, p.id, png(), { field: 'image' }).expect(400);
  });

  it('DELETE ảnh → 204; xóa lại hoặc chưa có ảnh → 404', async () => {
    const p = await createProduct(sb.app);
    await upload(sb.app, p.id, png()).expect(201);
    await http(sb.app).delete(`/v1/products/${p.id}/image`).set('x-api-key', 'dev-admin-key').expect(204);
    await http(sb.app).get(`/v1/products/${p.id}/image`).expect(404);
    await http(sb.app).delete(`/v1/products/${p.id}/image`).set('x-api-key', 'dev-admin-key').expect(404);
    await http(sb.app).delete(`/v1/products/${p.id}/image`).expect(401);
  });
});
