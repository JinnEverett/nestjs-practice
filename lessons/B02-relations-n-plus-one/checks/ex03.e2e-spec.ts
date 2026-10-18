import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { freshDatabase, resetCatalog } from './_db';
import { admin, makeProduct, one } from './_b02';
import { constraintsOf } from './_schema';
import { dataSourceOf } from './_db';

const put = (app: INestApplication, id: number, tags: unknown) => http(app).put(`/v1/products/${id}/tags`).set(admin).send({ tags });

describe('B02 ex03 · Quan hệ n-n: Product ↔ Tag qua bảng nối product_tags', () => {
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

  it('schema: tags UNIQUE(name) + CHECK; product_tags có khóa chính ghép (product_id, tag_id) và hai khóa ngoại CASCADE đặt tên', async () => {
    const ds = dataSourceOf(app);
    const t = await constraintsOf(ds, 'tags');
    expect(t.uq_tags_name).toBe('u');
    expect(t.ck_tags_name).toBe('c');
    const pk = await one<{ cols: string[] }>(
      app,
      `SELECT array_agg(a.attname::text ORDER BY k.ord) AS cols FROM pg_constraint c
         CROSS JOIN LATERAL unnest(c.conkey) WITH ORDINALITY AS k(attnum, ord) JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
        WHERE c.conrelid = 'product_tags'::regclass AND c.contype = 'p'`,
    );
    expect(pk.cols).toEqual(['product_id', 'tag_id']);
    const fks = (await ds.query(`SELECT conname, confdeltype FROM pg_constraint WHERE conrelid = 'product_tags'::regclass AND contype = 'f' ORDER BY conname`)) as { conname: string; confdeltype: string }[];
    expect(fks).toEqual([
      { conname: 'fk_product_tags_product', confdeltype: 'c' },
      { conname: 'fk_product_tags_tag', confdeltype: 'c' },
    ]);
  });

  it('PUT /v1/products/:id/tags: đặt tập nhãn, kết quả sắp theo tên; PUT lần hai THAY THẾ (không cộng dồn)', async () => {
    const p = await makeProduct(app);
    const first = await put(app, p.id, ['sale', 'new', 'hot']).expect(200);
    expect(first.body).toEqual({ productId: p.id, tags: ['hot', 'new', 'sale'] });
    const second = await put(app, p.id, ['new', 'eco']).expect(200);
    expect(second.body.tags).toEqual(['eco', 'new']);
    expect(((await dataSourceOf(app).query('SELECT t.name FROM product_tags pt JOIN tags t ON t.id = pt.tag_id WHERE pt.product_id = $1 ORDER BY t.name', [p.id])) as { name: string }[]).map((r) => r.name)).toEqual(['eco', 'new']);
    expect((await put(app, p.id, []).expect(200)).body.tags).toEqual([]);
    expect((await one<{ n: number }>(app, 'SELECT count(*)::int AS n FROM product_tags WHERE product_id = $1', [p.id])).n).toBe(0);
  });

  it('nhãn được dùng chung: hai sản phẩm cùng nhãn "sale" chỉ có MỘT dòng trong tags', async () => {
    const a = await makeProduct(app);
    const b = await makeProduct(app);
    await put(app, a.id, ['sale']).expect(200);
    await put(app, b.id, ['sale']).expect(200);
    expect((await one<{ n: number }>(app, `SELECT count(*)::int AS n FROM tags WHERE name = 'sale'`)).n).toBe(1);
  });

  it.each([
    ['chữ hoa', ['Sale']],
    ['có dấu cách', ['hot sale']],
    ['rỗng', ['']],
    ['dài 31 ký tự', ['a'.repeat(31)]],
    ['trùng trong cùng yêu cầu', ['sale', 'sale']],
    ['hơn 20 nhãn', Array.from({ length: 21 }, (_, i) => `t${i}`)],
    ['không phải mảng', 'sale'],
    ['phần tử không phải chuỗi', [1]],
  ])('dữ liệu sai (%s) → 400 và không đổi gì', async (_label, tags) => {
    const p = await makeProduct(app);
    await put(app, p.id, ['keep']).expect(200);
    const res = await put(app, p.id, tags);
    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/problem\+json/);
    expect((await put(app, p.id, ['keep']).expect(200)).body.tags).toEqual(['keep']);
  });

  it('sản phẩm không tồn tại → 404 product-not-found; thiếu khóa quản trị → 401', async () => {
    const res = await put(app, 99999, ['sale']).expect(404);
    expect(res.body.type).toBe('urn:shop:error:product-not-found');
    const p = await makeProduct(app);
    await http(app).put(`/v1/products/${p.id}/tags`).send({ tags: ['sale'] }).expect(401);
  });

  it('GET /v1/tags: tên + số sản phẩm (nhãn không còn sản phẩm có productCount 0); sắp theo tên', async () => {
    const a = await makeProduct(app);
    const b = await makeProduct(app);
    await put(app, a.id, ['sale', 'new']).expect(200);
    await put(app, b.id, ['sale']).expect(200);
    await put(app, a.id, ['new']).expect(200); // gỡ "sale" khỏi a
    const res = await http(app).get('/v1/tags').expect(200);
    expect(res.body.data).toEqual([{ name: 'new', productCount: 1 }, { name: 'sale', productCount: 1 }]);
    await put(app, b.id, []).expect(200);
    expect((await http(app).get('/v1/tags').expect(200)).body.data).toEqual([{ name: 'new', productCount: 1 }, { name: 'sale', productCount: 0 }]);
  });

  it('GET /v1/tags/:name/products: các sản phẩm mang nhãn (sắp theo id); nhãn lạ 404 tag-not-found; tên sai 400', async () => {
    const a = await makeProduct(app, { price: 11 });
    const b = await makeProduct(app, { price: 22 });
    await makeProduct(app);
    await put(app, b.id, ['sale']).expect(200);
    await put(app, a.id, ['sale']).expect(200);
    const res = await http(app).get('/v1/tags/sale/products').expect(200);
    expect(res.body.data.map((p: { id: number; price: number }) => [p.id, p.price])).toEqual([[a.id, 11], [b.id, 22]]);
    expect(res.body.meta.total).toBe(2);
    expect((await http(app).get('/v1/tags/nope/products').expect(404)).body.type).toBe('urn:shop:error:tag-not-found');
    await http(app).get('/v1/tags/BAD NAME/products').expect(400);
  });

  it('xóa sản phẩm: dòng nối biến mất (CASCADE) nhưng nhãn và các sản phẩm khác vẫn còn', async () => {
    const a = await makeProduct(app);
    const b = await makeProduct(app);
    await put(app, a.id, ['sale']).expect(200);
    await put(app, b.id, ['sale']).expect(200);
    await http(app).delete(`/v1/products/${a.id}`).set(admin).expect(204);
    expect((await one<{ n: number }>(app, 'SELECT count(*)::int AS n FROM product_tags')).n).toBe(1);
    expect((await one<{ n: number }>(app, `SELECT count(*)::int AS n FROM tags WHERE name = 'sale'`)).n).toBe(1);
    expect((await http(app).get('/v1/tags/sale/products').expect(200)).body.meta.total).toBe(1);
  });
});
