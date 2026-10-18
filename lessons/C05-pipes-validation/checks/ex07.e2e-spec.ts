import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C05 ex07 · 🔴 "isActive=false mà vẫn thấy hàng đang bán"', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
    await createProduct(app, { name: 'Đang bán', isActive: true });
    await createProduct(app, { name: 'Ngừng bán', isActive: false });
  });
  afterAll(async () => {
    await app.close();
  });

  const names = async (qs: string) =>
    ((await http(app).get(`/v1/products${qs}`).expect(200)).body.data as { name: string }[]).map((p) => p.name);

  it('GET ?isActive=false chỉ trả hàng ngừng bán; ?isActive=true chỉ trả hàng đang bán', async () => {
    expect(await names('?isActive=false')).toEqual(['Ngừng bán']);
    expect(await names('?isActive=true')).toEqual(['Đang bán']);
    expect(await names('')).toEqual(['Đang bán', 'Ngừng bán']);
  });

  it('?isActive không phải true/false (abc, 1, 0, rỗng, TRUE) → 400', async () => {
    for (const v of ['abc', '1', '0', '', 'TRUE']) await http(app).get(`/v1/products?isActive=${v}`).expect(400);
  });

  it('body không tự ép kiểu: price "100000", isActive "false", stock "5" → 400', async () => {
    await http(app).post('/v1/products').send({ sku: 'T-1', name: 'x', price: '100000' }).expect(400);
    await http(app).post('/v1/products').send({ sku: 'T-2', name: 'x', price: 1, isActive: 'false' }).expect(400);
    await http(app).post('/v1/products').send({ sku: 'T-3', name: 'x', price: 1, stock: '5' }).expect(400);
  });

  it('isActive: false trong body được giữ là false', async () => {
    const res = await http(app).post('/v1/products').send({ sku: 'T-4', name: 'x', price: 1, isActive: false }).expect(201);
    expect(res.body.isActive).toBe(false);
  });

  it('id trong path luôn là số: sản phẩm tìm được bằng cả "7" lẫn không bị ép kiểu lạ', async () => {
    const p = await createProduct(app);
    const res = await http(app).get(`/v1/products/${p.id}`).expect(200);
    expect(typeof res.body.id).toBe('number');
  });
});
