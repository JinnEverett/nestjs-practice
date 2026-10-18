import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { dataSourceOf, freshDatabase, resetCatalog } from './_db';
import { admin, makeProduct, one } from './_b02';

const put = (app: INestApplication, id: number, tags: string[]) => http(app).put(`/v1/products/${id}/tags`).set(admin).send({ tags });

describe('B02 ex07 · 🔴 "Hai người cùng gắn nhãn" (race condition trên quan hệ)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    await freshDatabase();
    app = await createTestApp();
  });
  beforeEach(async () => {
    await resetCatalog(app);
  });
  afterAll(async () => {
    await app?.close();
  });

  it('20 POST /v1/categories đồng thời cùng slug: đúng 1 × 201, 19 × 409 duplicate-slug, không 5xx', async () => {
    const rs = await Promise.all(Array.from({ length: 20 }, (_, i) => http(app).post('/v1/categories').set(admin).send({ name: `Lần ${i}`, slug: 'dup-slug' })));
    expect(rs.filter((r) => r.status === 201)).toHaveLength(1);
    expect(rs.filter((r) => r.status === 409)).toHaveLength(19);
    expect(rs.some((r) => r.status >= 500)).toBe(false);
    for (const r of rs.filter((r) => r.status === 409)) expect(r.body.type).toBe('urn:shop:error:duplicate-slug');
    expect((await one<{ n: number }>(app, `SELECT count(*)::int AS n FROM categories WHERE slug = 'dup-slug'`)).n).toBe(1);
  });

  it('10 sản phẩm khác nhau cùng được gắn nhãn MỚI "race-tag" đồng thời: tất cả 200, bảng tags chỉ có 1 dòng "race-tag", 10 dòng nối', async () => {
    const ps = await Promise.all(Array.from({ length: 10 }, () => makeProduct(app)));
    const rs = await Promise.all(ps.map((p) => put(app, p.id, ['race-tag'])));
    expect(rs.map((r) => r.status)).toEqual(Array(10).fill(200));
    expect((await one<{ n: number }>(app, `SELECT count(*)::int AS n FROM tags WHERE name = 'race-tag'`)).n).toBe(1);
    expect((await one<{ n: number }>(app, 'SELECT count(*)::int AS n FROM product_tags')).n).toBe(10);
  });

  it('40 PUT đồng thời trên CÙNG một sản phẩm với hai tập nhãn lớn chồng lấn nhau: không 5xx, kết quả cuối đúng bằng MỘT trong hai tập (không trộn)', async () => {
    const p = await makeProduct(app);
    const A = Array.from({ length: 20 }, (_, i) => `s${String(i).padStart(2, '0')}`); // s00..s19
    const B = Array.from({ length: 20 }, (_, i) => `s${String(i + 10).padStart(2, '0')}`); // s10..s29 (chồng lấn 10 nhãn)
    const rs = await Promise.all(Array.from({ length: 40 }, (_, i) => put(app, p.id, i % 2 === 0 ? A : B)));
    expect({ failures: rs.filter((r) => r.status !== 200).map((r) => r.status) }).toEqual({ failures: [] });
    const rows = (await dataSourceOf(app).query('SELECT t.name FROM product_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.product_id = $1 ORDER BY t.name', [p.id])) as { name: string }[];
    const final = rows.map((r) => r.name);
    expect([[...A].sort(), [...B].sort()]).toContainEqual(final);
  });

  it('PUT lặp lại cùng một tập (idempotent) không sinh dòng nối thừa', async () => {
    const p = await makeProduct(app);
    for (let i = 0; i < 5; i++) await put(app, p.id, ['x1', 'x2']).expect(200);
    expect((await one<{ n: number }>(app, 'SELECT count(*)::int AS n FROM product_tags WHERE product_id = $1', [p.id])).n).toBe(2);
  });
});
