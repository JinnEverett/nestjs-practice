import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { freshDatabase } from './_db';
import { npmRun, openProjectDataSource, one } from './_b03';

jest.setTimeout(300_000);

describe('B03 ex07 · 🔴 "Seed chạy cả buổi sáng": phải dùng SQL hàng loạt, không vòng lặp từng dòng', () => {
  beforeAll(async () => {
    await freshDatabase();
    const ds = await openProjectDataSource();
    await ds.runMigrations();
    await ds.destroy();
  });

  it('20 000 đơn (60 000 dòng hàng, 4 000 sản phẩm, 2 000 người dùng) sinh xong dưới 40 giây, kể cả thời gian khởi động ts-node', async () => {
    const r = npmRun('seed', ['--orders', '20000']);
    expect({ status: r.status, out: r.out.slice(-300) }).toMatchObject({ status: 0 });
    expect(r.ms).toBeLessThan(40_000);
    const ds = await openProjectDataSource();
    try {
      expect(await one(ds, `SELECT (SELECT count(*) FROM orders)::int AS orders, (SELECT count(*) FROM order_items)::int AS items, (SELECT count(*) FROM products)::int AS products, (SELECT count(*) FROM users)::int AS users`)).toEqual({
        orders: 20000,
        items: 60000,
        products: 4000,
        users: 2000,
      });
    } finally {
      await ds.destroy();
    }
  });

  it('thời gian seed báo trong output (time=...s) và tăng không quá tuyến tính nhiều: 20 000 đơn không chậm hơn 200 lần so với 100 đơn', async () => {
    const small = npmRun('seed', ['--orders', '100']);
    const big = npmRun('seed', ['--orders', '20000']);
    const secs = (out: string): number => Number(/time=([0-9.]+)s/.exec(out)?.[1]);
    expect(Number.isFinite(secs(small.out))).toBe(true);
    expect(secs(big.out)).toBeLessThan(Math.max(secs(small.out), 0.2) * 200);
    expect(secs(big.out)).toBeLessThan(30);
  });

  it('ứng dụng khởi động được trên dữ liệu vừa seed và phục vụ API trên đó (cây danh mục 5 gốc × 3 con, sản phẩm có danh mục thật)', async () => {
    const app: INestApplication = await createTestApp();
    try {
      const tree = await http(app).get('/v1/categories?include=children').expect(200);
      const roots = tree.body.data.filter((c: { parentId: number | null }) => c.parentId === null);
      expect(roots).toHaveLength(5);
      for (const root of roots) expect(root.children).toHaveLength(3);
      const page = await http(app).get('/v1/products?limit=5&sort=id').expect(200);
      expect(page.body.meta.total).toBe(4000);
      expect(page.body.data).toHaveLength(5);
      const withCategory = await http(app).get(`/v1/products/${page.body.data[0].id}?include=category,tags`).expect(200);
      expect(withCategory.body.category.id).toBeGreaterThanOrEqual(6);
    } finally {
      await app.close();
    }
  });
});
