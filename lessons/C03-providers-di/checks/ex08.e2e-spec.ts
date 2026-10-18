import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, postOrder } from './_fixtures';

describe('C03 ex08 · 🔴 giá tại thời điểm đặt và lệch 1 đồng', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('đổi giá sản phẩm sau khi đặt không làm đổi đơn cũ', async () => {
    const p = await createProduct(app, { price: 200_000, stock: 5 });
    const o = (await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] })).body;
    await http(app).patch(`/v1/products/${p.id}`).send({ price: 999_000 }).expect(200);
    const again = (await http(app).get(`/v1/orders/${o.id}`).expect(200)).body;
    expect(again.items[0].unitPrice).toBe(200_000);
    expect(again.totalAmount).toBe(o.totalAmount);
    const next = (await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] })).body;
    expect(next.items[0].unitPrice).toBe(999_000);
  });

  it('thân đơn trả về là bản sao: sửa giá/tồn kho sau đó không làm đổi dữ liệu đã trả', async () => {
    const p = await createProduct(app, { price: 100_000, stock: 5 });
    const o = (await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] })).body;
    const a = (await http(app).get(`/v1/orders/${o.id}`)).body;
    const b = (await http(app).get(`/v1/orders/${o.id}`)).body;
    expect(a).toEqual(b);
    expect(a).toEqual(o);
  });

  it('mọi số tiền trong đơn đều là số nguyên và totalAmount = Σ(unitPrice×qty) + ship − giảm', async () => {
    const prices = [33_333, 77_777, 123_457];
    const ids: number[] = [];
    for (const price of prices) ids.push((await createProduct(app, { price, stock: 50 })).id);
    for (const [qty, code] of [[1, 'WELCOME10'], [3, 'welcome10'], [7, undefined], [2, 'FREESHIP']] as const) {
      const items = ids.map((productId) => ({ productId, quantity: qty }));
      const res = await postOrder(app, { items, ...(code ? { discountCode: code } : {}) });
      expect(res.status).toBe(201);
      const o = res.body;
      const sum = o.items.reduce((s: number, i: { unitPrice: number; quantity: number }) => s + i.unitPrice * i.quantity, 0);
      expect(o.totalAmount).toBe(sum + o.shippingFee - o.discountAmount);
      for (const n of [o.shippingFee, o.discountAmount, o.totalAmount]) expect(Number.isInteger(n)).toBe(true);
    }
  });

  it('kế toán báo lệch 1 đồng: subtotal 333335 + WELCOME10 → giảm đúng 33333, tổng 330002', async () => {
    const p = await createProduct(app, { price: 333_335, stock: 5 });
    const res = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }], discountCode: 'WELCOME10' });
    expect(res.body).toMatchObject({ discountAmount: 33_333, shippingFee: 30_000, totalAmount: 330_002 });
  });

  it('ngưỡng miễn ship tính trên tiền hàng TRƯỚC khi giảm giá', async () => {
    const p = await createProduct(app, { price: 520_000, stock: 5 });
    const res = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }], discountCode: 'WELCOME10' });
    expect(res.body).toMatchObject({ shippingFee: 0, discountAmount: 52_000, totalAmount: 468_000 });
  });
});
