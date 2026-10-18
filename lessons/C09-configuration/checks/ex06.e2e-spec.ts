import { bootWith, errorText } from './_cfg';
import { http } from './_kit';
import { KEY } from './_fixtures';

async function orderTotals(env: Record<string, string>, price: number, qty: number, code?: string) {
  const app = await bootWith(env);
  try {
    const p = await http(app).post('/v1/products').set('x-api-key', KEY).send({ sku: 'PR-1', name: 'x', price, stock: 100 }).expect(201);
    const res = await http(app).post('/v1/orders').set('x-api-key', KEY).send({ items: [{ productId: p.body.id, quantity: qty }], ...(code ? { discountCode: code } : {}) }).expect(201);
    return res.body as { shippingFee: number; totalAmount: number; discountAmount: number };
  } finally {
    await app.close();
  }
}

describe('C09 ex06 · PricingModule.forRootAsync lấy giá trị từ cấu hình', () => {
  it('mặc định 30000 / 500000', async () => {
    expect(await orderTotals({}, 100_000, 1)).toMatchObject({ shippingFee: 30_000, totalAmount: 130_000 });
    expect((await orderTotals({}, 250_000, 2)).shippingFee).toBe(0);
  });

  it('SHIPPING_FEE đổi phí ship', async () => {
    expect(await orderTotals({ SHIPPING_FEE: '12000' }, 100_000, 1)).toMatchObject({ shippingFee: 12_000, totalAmount: 112_000 });
    expect((await orderTotals({ SHIPPING_FEE: '0' }, 100_000, 1)).shippingFee).toBe(0);
  });

  it('FREE_SHIPPING_THRESHOLD đổi ngưỡng miễn ship (biên: đúng ngưỡng thì miễn phí)', async () => {
    expect((await orderTotals({ FREE_SHIPPING_THRESHOLD: '100000' }, 100_000, 1)).shippingFee).toBe(0);
    expect((await orderTotals({ FREE_SHIPPING_THRESHOLD: '100001' }, 100_000, 1)).shippingFee).toBe(30_000);
  });

  it('mã giảm giá mặc định vẫn còn khi chỉ đổi phí ship (trộn với mặc định)', async () => {
    const o = await orderTotals({ SHIPPING_FEE: '10000' }, 300_000, 1, 'welcome10');
    expect(o).toMatchObject({ shippingFee: 10_000, discountAmount: 30_000, totalAmount: 280_000 });
  });

  it('giá trị cấu hình sai thì app không khởi động (đã kiểm ở ex03), không âm thầm dùng mặc định', async () => {
    expect(await errorText(bootWith({ SHIPPING_FEE: 'free' }))).toContain('SHIPPING_FEE');
  });
});
