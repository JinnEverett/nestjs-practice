import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, KEY, postOrder } from './_fixtures';

describe('C08 ex06 · vô hiệu hóa cache khi có ghi', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  const getP = (id: number) => http(app).get(`/v1/products/${id}`);

  it('PATCH sản phẩm → lần đọc sau thấy giá mới', async () => {
    const p = await createProduct(app, { price: 100 });
    await getP(p.id);
    expect((await getP(p.id)).headers['x-cache']).toBe('HIT');
    await http(app).patch(`/v1/products/${p.id}`).set('x-api-key', KEY).send({ price: 999 }).expect(200);
    const after = await getP(p.id);
    expect(after.body.price).toBe(999);
    expect(after.headers['x-cache']).toBe('MISS');
  });

  it('POST tạo sản phẩm mới → danh sách cache không bị cũ', async () => {
    const before = (await http(app).get('/v1/products')).body.meta.total;
    expect((await http(app).get('/v1/products')).headers['x-cache']).toBe('HIT');
    await createProduct(app);
    expect((await http(app).get('/v1/products')).body.meta.total).toBe(before + 1);
  });

  it('DELETE → đọc lại ra 404', async () => {
    const p = await createProduct(app);
    await getP(p.id);
    await http(app).delete(`/v1/products/${p.id}`).set('x-api-key', KEY).expect(204);
    await getP(p.id).expect(404);
  });

  it('🔴 đặt hàng làm đổi tồn kho: GET sản phẩm sau đó phải thấy tồn kho mới', async () => {
    const p = await createProduct(app, { stock: 1 });
    expect((await getP(p.id)).body.stock).toBe(1);
    expect((await getP(p.id)).headers['x-cache']).toBe('HIT');
    expect((await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] })).status).toBe(201);
    const after = await getP(p.id);
    expect(after.body.stock).toBe(0);
    expect(after.headers['x-cache']).toBe('MISS');
  });

  it('ghi THẤT BẠI (401, 400, 409, 404) không xóa cache', async () => {
    const p = await createProduct(app);
    await getP(p.id);
    await http(app).patch(`/v1/products/${p.id}`).send({ price: 1 }).expect(401);
    await http(app).patch(`/v1/products/${p.id}`).set('x-api-key', KEY).send({ price: -1 }).expect(400);
    await http(app).patch('/v1/products/999999').set('x-api-key', KEY).send({ price: 1 }).expect(404);
    expect((await getP(p.id)).headers['x-cache']).toBe('HIT');
  });
});
