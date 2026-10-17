import { INestApplication } from '@nestjs/common';
import { NestContainer } from '@nestjs/core';
import { PRICING_RULES } from '../../src/pricing/pricing.rules';
import { createTestApp } from './_kit';
import { createProduct, postOrder } from './_fixtures';

const moduleNames = (app: INestApplication): string[] => {
  const container = (app as unknown as { container: NestContainer }).container;
  return [...container.getModules().values()].map((m) => m.metatype?.name ?? '?');
};

describe('C04 ex07 · 🔴 "Hai bảng giá" sau khi tách module', () => {
  it('trong ứng dụng chỉ có MỘT PricingModule (không import forRoot lặp ở nhiều nơi)', async () => {
    const app = await createTestApp();
    try {
      expect(moduleNames(app).filter((n) => n === 'PricingModule')).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it('đổi bảng giá một lần (override PRICING_RULES) thì mọi đường tính tiền đổi theo', async () => {
    const rules = { shippingFee: 1_111, freeShippingThreshold: 10_000_000, codes: {} };
    const app = await createTestApp({ customize: (b) => b.overrideProvider(PRICING_RULES).useValue(rules) });
    try {
      const p = await createProduct(app, { price: 100_000, stock: 5 });
      const o = (await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] })).body;
      expect(o).toMatchObject({ shippingFee: 1_111, totalAmount: 101_111 });
      const free = (await postOrder(app, { items: [{ productId: p.id, quantity: 4 }] })).body;
      expect(free.shippingFee).toBe(1_111); // ngưỡng mới 10 triệu
    } finally {
      await app.close();
    }
  });

  it('mặc định của ứng dụng vẫn là 30000 / 500000 / WELCOME10 / FREESHIP', async () => {
    const app = await createTestApp();
    try {
      const p = await createProduct(app, { price: 300_000, stock: 5 });
      const o = (await postOrder(app, { items: [{ productId: p.id, quantity: 1 }], discountCode: 'welcome10' })).body;
      expect(o).toMatchObject({ shippingFee: 30_000, discountAmount: 30_000, totalAmount: 300_000 });
    } finally {
      await app.close();
    }
  });

  it('đồ thị module: ProductsModule không phụ thuộc OrdersModule (và ngược lại chỉ một chiều)', async () => {
    const app = await createTestApp();
    try {
      const container = (app as unknown as { container: NestContainer }).container;
      const byName = (n: string) => [...container.getModules().values()].find((m) => m.metatype?.name === n);
      const products = byName('ProductsModule');
      const orders = byName('OrdersModule');
      expect(products && orders).toBeTruthy();
      const importsOf = (m: NonNullable<typeof products>) => [...m.imports].map((i) => i.metatype?.name);
      expect(importsOf(products!)).not.toContain('OrdersModule');
      expect(importsOf(orders!)).toContain('ProductsModule');
    } finally {
      await app.close();
    }
  });
});
