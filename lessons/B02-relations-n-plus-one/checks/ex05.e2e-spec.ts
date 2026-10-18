import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { countQueries, freshDatabase, resetCatalog } from './_db';
import { admin, makeCategory, makeProduct } from './_b02';

const put = (app: INestApplication, id: number, tags: string[]) => http(app).put(`/v1/products/${id}/tags`).set(admin).send({ tags });

describe('B02 ex05 · ?include= trên chi tiết sản phẩm: nạp quan hệ khi được yêu cầu, không hơn', () => {
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

  it('không include: response không có category/tags và chỉ tốn đúng 1 truy vấn (không JOIN thừa)', async () => {
    const cat = await makeCategory(app);
    const p = await makeProduct(app, { categoryId: cat.id });
    await put(app, p.id, ['sale']).expect(200);
    const { result, queries } = await countQueries(() => http(app).get(`/v1/products/${p.id}`));
    expect(result.status).toBe(200);
    expect(result.body.category).toBeUndefined();
    expect(result.body.tags).toBeUndefined();
    expect(queries).toHaveLength(1);
    expect(queries[0]).not.toMatch(/JOIN/i);
  });

  it('include=category: thêm {id, name, slug} của danh mục, vẫn không có tags', async () => {
    const cat = await makeCategory(app, { name: 'Thời trang' });
    const p = await makeProduct(app, { categoryId: cat.id });
    const res = await http(app).get(`/v1/products/${p.id}?include=category`).expect(200);
    expect(res.body.category).toEqual({ id: cat.id, name: 'Thời trang', slug: cat.slug });
    expect(res.body.tags).toBeUndefined();
  });

  it('include=tags: mảng tên nhãn sắp theo tên; sản phẩm chưa có nhãn thì mảng rỗng (không phải undefined)', async () => {
    const p = await makeProduct(app);
    const none = await http(app).get(`/v1/products/${p.id}?include=tags`).expect(200);
    expect(none.body.tags).toEqual([]);
    await put(app, p.id, ['zeta', 'alpha', 'mid']).expect(200);
    const res = await http(app).get(`/v1/products/${p.id}?include=tags`).expect(200);
    expect(res.body.tags).toEqual(['alpha', 'mid', 'zeta']);
    expect(res.body.category).toBeUndefined();
  });

  it('include=category,tags (cả hai): chỉ tốn 1 hoặc 2 truy vấn, không tăng theo số nhãn', async () => {
    const cat = await makeCategory(app);
    const few = await makeProduct(app, { categoryId: cat.id });
    const many = await makeProduct(app, { categoryId: cat.id });
    await put(app, few.id, ['a1']).expect(200);
    await put(app, many.id, Array.from({ length: 15 }, (_, i) => `t${i}`)).expect(200);
    const a = await countQueries(() => http(app).get(`/v1/products/${few.id}?include=category,tags`));
    const b = await countQueries(() => http(app).get(`/v1/products/${many.id}?include=category,tags`));
    expect(a.result.body.tags).toHaveLength(1);
    expect(b.result.body.tags).toHaveLength(15);
    expect(a.result.body.category.id).toBe(cat.id);
    expect(b.queries.length).toBeLessThanOrEqual(2);
    expect(b.queries.length).toBe(a.queries.length);
  });

  it('include lạ → 400 problem+json; include rỗng (?include=) coi như không có', async () => {
    const p = await makeProduct(app);
    for (const q of ['include=foo', 'include=category,bar', 'include=Category']) {
      const res = await http(app).get(`/v1/products/${p.id}?${q}`);
      expect({ q, status: res.status }).toEqual({ q, status: 400 });
      expect(res.headers['content-type']).toMatch(/problem\+json/);
    }
    const empty = await http(app).get(`/v1/products/${p.id}?include=`).expect(200);
    expect(empty.body.category).toBeUndefined();
  });

  it('sản phẩm không tồn tại vẫn 404 khi có include; id sai 400', async () => {
    expect((await http(app).get('/v1/products/99999?include=category,tags').expect(404)).body.type).toBe('urn:shop:error:product-not-found');
    await http(app).get('/v1/products/abc?include=tags').expect(400);
  });

  it('đổi nhãn rồi đọc lại phải thấy dữ liệu mới (bản cache GET của C08 bị xóa khi có ghi)', async () => {
    const p = await makeProduct(app);
    await put(app, p.id, ['old']).expect(200);
    expect((await http(app).get(`/v1/products/${p.id}?include=tags`).expect(200)).body.tags).toEqual(['old']);
    await put(app, p.id, ['new']).expect(200);
    expect((await http(app).get(`/v1/products/${p.id}?include=tags`).expect(200)).body.tags).toEqual(['new']);
  });
});
