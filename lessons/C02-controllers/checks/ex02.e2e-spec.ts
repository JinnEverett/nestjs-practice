import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C02 ex02 · PATCH và DELETE', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('PATCH cập nhật một phần, giữ nguyên các trường còn lại', async () => {
    const p = await createProduct(app, { brand: 'Acme', stock: 5 });
    const res = await http(app).patch(`/v1/products/${p.id}`).send({ price: 150000 }).expect(200);
    expect(res.body).toEqual({ ...p, price: 150000 });
    const again = await http(app).get(`/v1/products/${p.id}`).expect(200);
    expect(again.body.price).toBe(150000);
    expect(again.body.brand).toBe('Acme');
  });

  it('PATCH có thể đặt brand về null và stock về 0 (0/null không bị bỏ qua)', async () => {
    const p = await createProduct(app, { brand: 'Acme', stock: 5 });
    const res = await http(app).patch(`/v1/products/${p.id}`).send({ brand: null, stock: 0, isActive: false }).expect(200);
    expect(res.body).toMatchObject({ brand: null, stock: 0, isActive: false });
  });

  it('PATCH không đổi id/createdAt dù client gửi lên', async () => {
    const p = await createProduct(app);
    const res = await http(app)
      .patch(`/v1/products/${p.id}`)
      .send({ id: 12345, createdAt: '2000-01-01T00:00:00.000Z', name: 'Tên mới' })
      .expect(200);
    expect(res.body.id).toBe(p.id);
    expect(res.body.createdAt).toBe(p.createdAt);
    expect(res.body.name).toBe('Tên mới');
  });

  it('PATCH id không tồn tại → 404; giá trị sai → 400; sku trùng sản phẩm khác → 409; giữ sku của chính nó → 200', async () => {
    const a = await createProduct(app);
    const b = await createProduct(app);
    await http(app).patch('/v1/products/999999').send({ price: 1 }).expect(404);
    await http(app).patch(`/v1/products/${a.id}`).send({ price: -5 }).expect(400);
    await http(app).patch(`/v1/products/${a.id}`).send({ sku: b.sku.toLowerCase() }).expect(409);
    await http(app).patch(`/v1/products/${a.id}`).send({ sku: a.sku }).expect(200);
  });

  it('DELETE → 204 không có body; GET sau đó → 404; DELETE lần hai → 404', async () => {
    const p = await createProduct(app);
    const res = await http(app).delete(`/v1/products/${p.id}`).expect(204);
    expect(res.text).toBe('');
    await http(app).get(`/v1/products/${p.id}`).expect(404);
    await http(app).delete(`/v1/products/${p.id}`).expect(404);
  });
});
