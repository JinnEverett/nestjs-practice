import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, postOrder, stockOf } from './_fixtures';

describe('C03 ex04 · đặt hàng in-memory', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/orders → 201, Location, tính tiền theo giá sản phẩm, trừ tồn kho', async () => {
    const p = await createProduct(app, { price: 150_000, stock: 10 });
    const res = await postOrder(app, { items: [{ productId: p.id, quantity: 2 }] }).then((r) => {
      expect(r.status).toBe(201);
      return r;
    });
    expect(res.headers.location).toBe(`/v1/orders/${res.body.id}`);
    expect(res.body).toMatchObject({
      userId: 1,
      status: 'pending',
      items: [{ productId: p.id, quantity: 2, unitPrice: 150_000 }],
      shippingFee: 30_000,
      discountCode: null,
      discountAmount: 0,
      totalAmount: 330_000,
    });
    expect(new Date(res.body.createdAt).toISOString()).toBe(res.body.createdAt);
    expect(res.body.updatedAt).toBe(res.body.createdAt);
    expect(await stockOf(app, p.id)).toBe(8);
  });

  it('GET /v1/orders/:id → 200; không có → 404; id không phải số → 400', async () => {
    const p = await createProduct(app, { stock: 5 });
    const o = (await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] })).body;
    const got = await http(app).get(`/v1/orders/${o.id}`).expect(200);
    expect(got.body).toEqual(o);
    await http(app).get('/v1/orders/999999').expect(404);
    await http(app).get('/v1/orders/abc').expect(400);
  });

  it('không tin unitPrice/totalAmount/userId do client gửi', async () => {
    const p = await createProduct(app, { price: 100_000, stock: 5 });
    const res = await postOrder(app, {
      userId: 99,
      totalAmount: 1,
      items: [{ productId: p.id, quantity: 1, unitPrice: 1 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.items[0].unitPrice).toBe(100_000);
    expect(res.body.totalAmount).toBe(130_000);
    expect(res.body.userId).toBe(1);
  });

  it('các dòng cùng productId được gộp và kiểm tồn kho theo TỔNG', async () => {
    const p = await createProduct(app, { price: 10_000, stock: 5 });
    const bad = await postOrder(app, { items: [{ productId: p.id, quantity: 3 }, { productId: p.id, quantity: 3 }] });
    expect(bad.status).toBe(409);
    expect(await stockOf(app, p.id)).toBe(5);
    const ok = await postOrder(app, { items: [{ productId: p.id, quantity: 2 }, { productId: p.id, quantity: 3 }] });
    expect(ok.status).toBe(201);
    expect(ok.body.items).toEqual([{ productId: p.id, quantity: 5, unitPrice: 10_000 }]);
    expect(await stockOf(app, p.id)).toBe(0);
  });

  it('mã giảm giá được chuẩn hóa và áp dụng', async () => {
    const p = await createProduct(app, { price: 300_000, stock: 5 });
    const res = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }], discountCode: 'welcome10' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ discountCode: 'WELCOME10', discountAmount: 30_000, shippingFee: 30_000, totalAmount: 300_000 });
  });

  it('lỗi: items rỗng/thiếu/sai kiểu → 400; sản phẩm không có hoặc ngừng bán → 422; hết hàng → 409; mã sai → 422', async () => {
    const live = await createProduct(app, { stock: 1 });
    const off = await createProduct(app, { stock: 5, isActive: false });
    const cases: [unknown, number][] = [
      [{}, 400],
      [{ items: [] }, 400],
      [{ items: 'x' }, 400],
      [{ items: [{ productId: live.id, quantity: 0 }] }, 400],
      [{ items: [{ productId: live.id, quantity: 1.5 }] }, 400],
      [{ items: [{ productId: '1', quantity: 1 }] }, 400],
      [{ items: [{ productId: 999_999, quantity: 1 }] }, 422],
      [{ items: [{ productId: off.id, quantity: 1 }] }, 422],
      [{ items: [{ productId: live.id, quantity: 2 }] }, 409],
      [{ items: [{ productId: live.id, quantity: 1 }], discountCode: 'NOPE' }, 422],
    ];
    for (const [body, status] of cases) {
      const res = await postOrder(app, body as Record<string, unknown>);
      expect({ body, status: res.status }).toEqual({ body, status });
    }
    expect(await stockOf(app, live.id)).toBe(1);
  });
});
