import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, postOrder } from './_fixtures';

describe('C06 ex06 · 🔴 "Mobile phải đoán lỗi từ chuỗi message"', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('hai lỗi cùng 409 nhưng khác type: out-of-stock, duplicate-sku, conflict', async () => {
    const a = await createProduct(app, { sku: 'MB-1', stock: 1 });
    const types = new Set<string>();
    types.add((await http(app).post('/v1/products').send({ sku: 'mb-1', name: 'x', price: 1 }).expect(409)).body.type);
    types.add((await postOrder(app, { items: [{ productId: a.id, quantity: 9 }] })).body.type);
    await postOrder(app, { items: [{ productId: a.id, quantity: 1 }] });
    types.add((await http(app).delete(`/v1/products/${a.id}`).expect(409)).body.type);
    expect([...types].sort()).toEqual(['urn:shop:error:conflict', 'urn:shop:error:duplicate-sku', 'urn:shop:error:out-of-stock']);
  });

  it('đơn nhiều dòng hết hàng: báo dòng đầu tiên (theo thứ tự gửi) không đủ, kho không đổi', async () => {
    const ok = await createProduct(app, { stock: 10 });
    const s1 = await createProduct(app, { stock: 1 });
    const s2 = await createProduct(app, { stock: 0 });
    const res = await postOrder(app, { items: [{ productId: ok.id, quantity: 2 }, { productId: s1.id, quantity: 3 }, { productId: s2.id, quantity: 1 }] });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ type: 'urn:shop:error:out-of-stock', productId: s1.id, requested: 3, available: 1 });
    expect((await http(app).get(`/v1/products/${ok.id}`)).body.stock).toBe(10);
  });

  it('dòng trùng sản phẩm được cộng dồn trong thông báo: requested là TỔNG', async () => {
    const p = await createProduct(app, { stock: 4 });
    const res = await postOrder(app, { items: [{ productId: p.id, quantity: 3 }, { productId: p.id, quantity: 3 }] });
    expect(res.body).toMatchObject({ type: 'urn:shop:error:out-of-stock', requested: 6, available: 4 });
  });

  it('title ổn định theo status; detail tiếng Việt đọc được cho người', async () => {
    const res = await http(app).get('/v1/products/777').expect(404);
    expect(res.body.title).toBe('Not Found');
    expect(res.body.detail).toBe('Không có sản phẩm #777');
  });

  it('cùng một lỗi lặp lại cho kết quả giống hệt (xác định)', async () => {
    const a = (await http(app).get('/v1/products/778')).body;
    const b = (await http(app).get('/v1/products/778')).body;
    expect(a).toEqual(b);
  });
});
