import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { dataSourceOf, freshDatabase, resetCatalog, resetDatabase } from './_db';
import { admin, makeCategory, makeProduct, one } from './_b02';

describe('B02 ex01 · Quan hệ 1-n: Category → Product, khóa ngoại và API danh mục', () => {
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

  it('khóa ngoại fk_products_category: ON DELETE RESTRICT, và có index phủ cột category_id', async () => {
    const fk = await one<{ confdeltype: string; target: string }>(
      app,
      `SELECT c.confdeltype, c.confrelid::regclass::text AS target FROM pg_constraint c WHERE c.conname = 'fk_products_category' AND c.conrelid = 'products'::regclass`,
    );
    expect(fk).toEqual({ confdeltype: 'r', target: 'categories' });
    const idx = await one<{ n: number }>(
      app,
      `SELECT count(*)::int AS n FROM pg_index i WHERE i.indrelid = 'products'::regclass AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'products'::regclass AND attname = 'category_id')`,
    );
    expect(idx.n).toBeGreaterThanOrEqual(1);
  });

  it('POST /v1/categories: 201 + Location, slug trùng 409 duplicate-slug, dữ liệu sai 400', async () => {
    const res = await http(app).post('/v1/categories').set(admin).send({ name: 'Áo thun', slug: 'ao-thun' }).expect(201);
    expect(res.headers.location).toBe(`/v1/categories/${res.body.id}`);
    expect(res.body).toEqual({ id: res.body.id, parentId: null, name: 'Áo thun', slug: 'ao-thun' });
    const dup = await http(app).post('/v1/categories').set(admin).send({ name: 'Khác', slug: 'ao-thun' }).expect(409);
    expect(dup.body.type).toBe('urn:shop:error:duplicate-slug');
    for (const bad of [{ slug: 'x' }, { name: 'a' }, { name: 'a', slug: 'Chữ Hoa' }, { name: 'a', slug: 'a--b' }, { name: '', slug: 'a' }, { name: 'a', slug: 'a', parentId: 0 }]) {
      await http(app).post('/v1/categories').set(admin).send(bad).expect(400);
    }
    await http(app).post('/v1/categories').send({ name: 'a', slug: 'a' }).expect(401);
  });

  it('sản phẩm tham chiếu danh mục thật; danh mục không tồn tại → 422 invalid-category và DB không đổi', async () => {
    const cat = await makeCategory(app);
    const ok = await makeProduct(app, { categoryId: cat.id });
    expect(ok.categoryId).toBe(cat.id);
    const bad = await http(app).post('/v1/products').set(admin).send({ sku: 'NOCAT-1', name: 'x', price: 1, categoryId: 99999 });
    expect(bad.status).toBe(422);
    expect(bad.headers['content-type']).toMatch(/problem\+json/);
    expect(bad.body.type).toBe('urn:shop:error:invalid-category');
    expect((await one<{ n: number }>(app, `SELECT count(*)::int AS n FROM products WHERE sku = 'NOCAT-1'`)).n).toBe(0);
  });

  it('PATCH đổi sang danh mục không tồn tại cũng 422 (không phải 500); đổi sang danh mục thật thì được', async () => {
    const a = await makeCategory(app);
    const b = await makeCategory(app);
    const p = await makeProduct(app, { categoryId: a.id });
    const res = await http(app).patch(`/v1/products/${p.id}`).set(admin).send({ categoryId: 88888 });
    expect({ status: res.status, type: res.body.type }).toEqual({ status: 422, type: 'urn:shop:error:invalid-category' });
    await http(app).patch(`/v1/products/${p.id}`).set(admin).send({ categoryId: b.id }).expect(200);
    expect((await one<{ category_id: number }>(app, 'SELECT category_id FROM products WHERE id = $1', [p.id])).category_id).toBe(b.id);
  });

  it('không gửi categoryId thì dùng danh mục mặc định 1 (C02); khi DB không có danh mục 1 thì 422 thay vì 500', async () => {
    const withDefault = await http(app).post('/v1/products').set(admin).send({ sku: 'DEF-001', name: 'x', price: 1 }).expect(201);
    expect(withDefault.body.categoryId).toBe(1);
    await resetDatabase(app); // xóa cả danh mục 1
    const res = await http(app).post('/v1/products').set(admin).send({ sku: 'DEF-002', name: 'x', price: 1 });
    expect({ status: res.status, type: res.body.type }).toEqual({ status: 422, type: 'urn:shop:error:invalid-category' });
  });

  it('GET /v1/categories/:id và DELETE: 404 category-not-found cho id lạ; 409 category-in-use khi còn sản phẩm; xóa được khi rỗng', async () => {
    const cat = await makeCategory(app);
    await http(app).get(`/v1/categories/${cat.id}`).expect(200);
    const miss = await http(app).get('/v1/categories/99999').expect(404);
    expect(miss.body.type).toBe('urn:shop:error:category-not-found');
    await http(app).get('/v1/categories/abc').expect(400);
    const p = await makeProduct(app, { categoryId: cat.id });
    const blocked = await http(app).delete(`/v1/categories/${cat.id}`).set(admin).expect(409);
    expect(blocked.body.type).toBe('urn:shop:error:category-in-use');
    expect((await one<{ n: number }>(app, 'SELECT count(*)::int AS n FROM products WHERE id = $1', [p.id])).n).toBe(1); // sản phẩm còn nguyên
    await http(app).delete(`/v1/products/${p.id}`).set(admin).expect(204);
    await http(app).delete(`/v1/categories/${cat.id}`).set(admin).expect(204);
    await http(app).delete(`/v1/categories/${cat.id}`).set(admin).expect(404);
    expect(dataSourceOf(app).isInitialized).toBe(true);
  });

  it('?include=products trên chi tiết danh mục trả đúng các sản phẩm của nó (sắp theo id), không lẫn danh mục khác', async () => {
    const a = await makeCategory(app);
    const b = await makeCategory(app);
    const p1 = await makeProduct(app, { categoryId: a.id, price: 10 });
    await makeProduct(app, { categoryId: b.id });
    const p2 = await makeProduct(app, { categoryId: a.id, price: 20 });
    const res = await http(app).get(`/v1/categories/${a.id}?include=products`).expect(200);
    expect(res.body.products.map((p: { id: number; price: number }) => [p.id, p.price])).toEqual([[p1.id, 10], [p2.id, 20]]);
    expect(Object.keys(res.body.products[0]).sort()).toEqual(['id', 'name', 'price', 'sku']);
    expect(res.body.children).toBeUndefined();
  });
});
