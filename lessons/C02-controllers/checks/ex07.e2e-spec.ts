import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';

describe('C02 ex07 · 🔴 SKU trùng khác hoa thường', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('"ao-001" và "AO-001" là cùng một SKU → lần hai 409', async () => {
    await http(app).post('/v1/products').send({ sku: 'ao-001', name: 'Áo', price: 1 }).expect(201);
    await http(app).post('/v1/products').send({ sku: 'AO-001', name: 'Áo bản 2', price: 1 }).expect(409);
    await http(app).post('/v1/products').send({ sku: '  Ao-001 ', name: 'Áo bản 3', price: 1 }).expect(409);
  });

  it('SKU được lưu và trả về dạng chuẩn hóa (chữ hoa, đã trim)', async () => {
    const res = await http(app).post('/v1/products').send({ sku: ' quan-9 ', name: 'Quần', price: 1 }).expect(201);
    expect(res.body.sku).toBe('QUAN-9');
    await http(app).get('/v1/p/quan-9').redirects(0).expect(302);
  });

  it('xóa rồi tạo lại cùng SKU được phép; id không bị tái sử dụng', async () => {
    const a = (await http(app).post('/v1/products').send({ sku: 'TMP-1', name: 'a', price: 1 }).expect(201)).body;
    await http(app).delete(`/v1/products/${a.id}`).expect(204);
    const b = (await http(app).post('/v1/products').send({ sku: 'tmp-1', name: 'b', price: 1 }).expect(201)).body;
    expect(b.id).not.toBe(a.id);
  });

  it('SKU dài 21 ký tự → 400, dài 20 ký tự → 201', async () => {
    await http(app).post('/v1/products').send({ sku: 'A'.repeat(21), name: 'a', price: 1 }).expect(400);
    await http(app).post('/v1/products').send({ sku: 'A'.repeat(20), name: 'a', price: 1 }).expect(201);
  });
});
