import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, KEY, postOrder } from './_fixtures';

describe('Q04 ex04 · GET /v1/products/low-stock (e2e cho phần đỉnh kim tự tháp)', () => {
  let app: INestApplication;
  const ids: Record<string, number> = {};
  beforeAll(async () => {
    app = await createTestApp();
    ids.zero = (await createProduct(app, { stock: 0 })).id;
    ids.one = (await createProduct(app, { stock: 1 })).id;
    ids.five = (await createProduct(app, { stock: 5 })).id;
    ids.six = (await createProduct(app, { stock: 6 })).id;
    ids.offLow = (await createProduct(app, { stock: 0, isActive: false })).id;
    ids.oneB = (await createProduct(app, { stock: 1 })).id;
  });
  afterAll(async () => {
    await app.close();
  });
  const get = (qs = '', key: string | null = KEY) => {
    const r = http(app).get(`/v1/products/low-stock${qs}`);
    if (key !== null) r.set('x-api-key', key);
    return r;
  };

  it('cần X-Api-Key (dữ liệu tồn kho là nội bộ)', async () => {
    await get('', null).expect(401);
  });

  it('mặc định ngưỡng 5: đang bán, tồn <= 5, ít hàng nhất trước, hòa thì id nhỏ trước', async () => {
    const res = await get().expect(200);
    expect(res.body.data.map((p: { id: number }) => p.id)).toEqual([ids.zero, ids.one, ids.oneB, ids.five]);
    expect(res.body.meta).toEqual({ threshold: 5, total: 4 });
  });

  it('threshold tùy chọn, kể cả 0', async () => {
    expect((await get('?threshold=0').expect(200)).body.data.map((p: { id: number }) => p.id)).toEqual([ids.zero]);
    expect((await get('?threshold=6').expect(200)).body.meta).toEqual({ threshold: 6, total: 5 });
  });

  it.each(['?threshold=-1', '?threshold=1001', '?threshold=1.5', '?threshold=abc', '?limit=3'])('tham số sai %s → 400', async (qs) => {
    const res = await get(qs).expect(400);
    expect(res.body.type).toBe('urn:shop:error:validation');
  });

  it('route tĩnh không bị `:id` nuốt (không phải 400 của ParseIdPipe nói về id)', async () => {
    const res = await get().expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('phản ánh ngay sau khi bán hàng (không bị cache): đặt hàng làm sản phẩm tồn 6 xuống 5', async () => {
    expect((await get('?threshold=5')).body.data.map((p: { id: number }) => p.id)).not.toContain(ids.six);
    await postOrder(app, { items: [{ productId: ids.six, quantity: 1 }] }).then((r) => expect(r.status).toBe(201));
    expect((await get('?threshold=5')).body.data.map((p: { id: number }) => p.id)).toContain(ids.six);
  });

  it('thân phản hồi chứa sản phẩm đầy đủ, mỗi lần là bản sao mới', async () => {
    const a = await get().expect(200);
    a.body.data[0].stock = 123456;
    expect((await get().expect(200)).body.data[0].stock).toBeLessThanOrEqual(5);
    expect(Object.keys(a.body.data[0]).sort()).toEqual(
      ['attributes', 'brand', 'categoryId', 'createdAt', 'id', 'isActive', 'name', 'price', 'sku', 'stock'],
    );
  });
});
