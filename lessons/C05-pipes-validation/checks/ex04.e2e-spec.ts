import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C05 ex04 · PATCH với PartialType', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  const patch = (id: number, body: unknown) => http(app).patch(`/v1/products/${id}`).send(body as object);

  it('chỉ field gửi lên mới bị kiểm; vắng mặt thì giữ nguyên', async () => {
    const p = await createProduct(app, { stock: 7, brand: 'Acme' });
    const res = await patch(p.id, { price: 1 }).expect(200);
    expect(res.body).toEqual({ ...p, price: 1 });
  });

  it('body rỗng → 200, không đổi gì', async () => {
    const p = await createProduct(app);
    expect((await patch(p.id, {}).expect(200)).body).toEqual(p);
  });

  it('các luật của Create vẫn áp dụng cho field có mặt', async () => {
    const p = await createProduct(app);
    for (const [body, field] of [
      [{ price: -1 }, 'price'], [{ sku: 'a b' }, 'sku'], [{ name: '  ' }, 'name'], [{ stock: 1.5 }, 'stock'],
    ] as const) {
      const res = await patch(p.id, body).expect(400);
      expect((res.body.message as string[]).join(' ')).toContain(field);
    }
  });

  it('null chỉ hợp lệ cho brand; các field khác gửi null → 400 (không làm hỏng dữ liệu)', async () => {
    const p = await createProduct(app, { brand: 'Acme', stock: 3 });
    for (const field of ['price', 'stock', 'isActive', 'categoryId', 'name', 'sku', 'attributes']) {
      await patch(p.id, { [field]: null }).expect(400);
    }
    const ok = await patch(p.id, { brand: null }).expect(200);
    expect(ok.body.brand).toBeNull();
    expect((await http(app).get(`/v1/products/${p.id}`)).body).toMatchObject({ stock: 3, price: 100000, isActive: true });
  });

  it('không cho PATCH id/createdAt (field lạ với DTO) → 400', async () => {
    const p = await createProduct(app);
    await patch(p.id, { id: 99 }).expect(400);
    await patch(p.id, { createdAt: '2000-01-01T00:00:00.000Z' }).expect(400);
  });

  it('PATCH id không tồn tại vẫn là 404 khi body hợp lệ', async () => {
    await patch(999999, { price: 1 }).expect(404);
  });
});
