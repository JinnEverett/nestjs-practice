import { createTestApp, http } from './_kit';
import { PRICING_RULES } from '../../src/pricing/pricing.rules';
import { createProduct, postOrder } from './_fixtures';

describe('C03 ex03 · useValue: PRICING_RULES thay được trong test', () => {
  it('đổi quy tắc giá bằng overrideProvider → tổng tiền đổi theo', async () => {
    const rules = {
      shippingFee: 10_000,
      freeShippingThreshold: 100_000,
      codes: { TET: { type: 'percent', percent: 20, maxDiscount: 50_000, minSubtotal: 0 } },
    };
    const app = await createTestApp({ customize: (b) => b.overrideProvider(PRICING_RULES).useValue(rules) });
    try {
      const p = await createProduct(app, { price: 60_000, stock: 10 });
      const small = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] }).then((r) => r.body);
      expect(small).toMatchObject({ shippingFee: 10_000, totalAmount: 70_000 });
      const free = await postOrder(app, { items: [{ productId: p.id, quantity: 2 }] }).then((r) => r.body);
      expect(free).toMatchObject({ shippingFee: 0, totalAmount: 120_000 });
      const tet = await postOrder(app, { items: [{ productId: p.id, quantity: 2 }], discountCode: 'tet' }).then((r) => r.body);
      expect(tet).toMatchObject({ discountCode: 'TET', discountAmount: 24_000, totalAmount: 96_000 });
      await postOrder(app, { items: [{ productId: p.id, quantity: 1 }], discountCode: 'WELCOME10' }).then((r) => expect(r.status).toBe(422));
    } finally {
      await app.close();
    }
  });

  it('quy tắc mặc định giữ đúng hợp đồng (30000 / 500000)', async () => {
    const app = await createTestApp();
    try {
      const p = await createProduct(app, { price: 100_000, stock: 10 });
      const o = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] });
      expect(o.body).toMatchObject({ shippingFee: 30_000, totalAmount: 130_000 });
      const free = await postOrder(app, { items: [{ productId: p.id, quantity: 5 }] });
      expect(free.body).toMatchObject({ shippingFee: 0, totalAmount: 500_000 });
      expect((await http(app).get(`/v1/orders/${free.body.id}`).expect(200)).body.totalAmount).toBe(500_000);
    } finally {
      await app.close();
    }
  });
});
