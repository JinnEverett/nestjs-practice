import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { countQueries, dataSourceOf, freshDatabase, resetCatalog } from './_db';

/** n danh mục (n/5 gốc, còn lại là con), mỗi danh mục 3 sản phẩm, dựng bằng SQL để nhanh. */
async function seed(app: INestApplication, n: number): Promise<void> {
  const ds = dataSourceOf(app);
  await ds.query(`INSERT INTO categories (name, slug, parent_id) SELECT 'DM ' || g, 'dm-' || g, CASE WHEN g > $1 / 5 THEN 1 + (g % ($1 / 5)) END FROM generate_series(1, $1) g`, [n]);
  await ds.query(`INSERT INTO products (category_id, sku, name, price) SELECT c.id, 'N1-' || c.id || '-' || k, 'SP', 1000 FROM categories c, generate_series(1, 3) k`);
}

describe('B02 ex06 · 🔴 "Trang danh mục mở chậm dần": N+1', () => {
  let app: INestApplication;
  beforeAll(async () => {
    await freshDatabase();
    app = await createTestApp();
  });
  beforeEach(async () => {
    await resetCatalog(app);
    await dataSourceOf(app).query('TRUNCATE categories RESTART IDENTITY CASCADE'); // bắt đầu không có danh mục mặc định
  });
  afterAll(async () => {
    await app?.close();
  });

  it('GET /v1/categories?include=products với 10 danh mục: dữ liệu đầy đủ và đúng thứ tự', async () => {
    await seed(app, 10);
    const res = await http(app).get('/v1/categories?include=products').expect(200);
    expect(res.body.data).toHaveLength(10);
    expect(res.body.data.map((c: { id: number }) => c.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const c of res.body.data) {
      expect(c.products).toHaveLength(3);
      expect(c.products.map((p: { id: number }) => p.id)).toEqual([...c.products.map((p: { id: number }) => p.id)].sort((a: number, b: number) => a - b));
      expect(c.children).toBeUndefined();
    }
  });

  it('số truy vấn KHÔNG tăng theo số danh mục: include=products ở 10 và 60 danh mục tốn bằng nhau và ≤ 2', async () => {
    await seed(app, 10);
    const small = await countQueries(() => http(app).get('/v1/categories?include=products'));
    await dataSourceOf(app).query('TRUNCATE categories RESTART IDENTITY CASCADE');
    await seed(app, 60);
    const big = await countQueries(() => http(app).get('/v1/categories?include=products'));
    expect(big.result.body.data).toHaveLength(60);
    expect(small.queries.length).toBeLessThanOrEqual(2);
    expect(big.queries.length).toBe(small.queries.length);
  });

  it('include=children,products cũng không N+1; dữ liệu con đúng', async () => {
    await seed(app, 50);
    const { result, queries } = await countQueries(() => http(app).get('/v1/categories?include=children,products'));
    expect(queries.length).toBeLessThanOrEqual(2);
    const byId = new Map<number, { id: number; children: { id: number; parentId: number }[]; products: unknown[] }>(result.body.data.map((c: { id: number }) => [c.id, c]));
    const withChildren = [...byId.values()].filter((c) => c.children.length > 0);
    expect(withChildren.length).toBeGreaterThan(0);
    for (const c of withChildren) for (const child of c.children) expect(child.parentId).toBe(c.id);
    const totalChildren = [...byId.values()].reduce((s, c) => s + c.children.length, 0);
    expect(totalChildren).toBe(40); // 50 danh mục, 10 gốc → 40 con
    for (const c of byId.values()) expect(c.products).toHaveLength(3);
  });

  it('không include thì chỉ 1 truy vấn đơn giản, không JOIN', async () => {
    await seed(app, 20);
    const { result, queries } = await countQueries(() => http(app).get('/v1/categories'));
    expect(result.body.data).toHaveLength(20);
    expect(queries).toHaveLength(1);
    expect(queries[0]).not.toMatch(/JOIN/i);
  });

  it('danh mục không có sản phẩm/con vẫn xuất hiện với mảng rỗng (LEFT JOIN, không phải INNER JOIN làm mất dòng)', async () => {
    const ds = dataSourceOf(app);
    await ds.query(`INSERT INTO categories (name, slug) VALUES ('Trống', 'trong'), ('Có hàng', 'co-hang')`);
    await ds.query(`INSERT INTO products (category_id, sku, name, price) VALUES (2, 'N1-ONLY', 'SP', 1)`);
    const res = await http(app).get('/v1/categories?include=children,products').expect(200);
    expect(res.body.data.map((c: { slug: string; products: unknown[]; children: unknown[] }) => [c.slug, c.products.length, c.children.length])).toEqual([['trong', 0, 0], ['co-hang', 1, 0]]);
  });
});
