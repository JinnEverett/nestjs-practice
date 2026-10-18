import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { freshDatabase, resetCatalog } from './_db';
import { admin, makeCategory, makeProduct, one } from './_b02';

describe('B02 ex02 · Cây danh mục (quan hệ tự tham chiếu)', () => {
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

  it('khóa ngoại tự tham chiếu fk_categories_parent (RESTRICT) và index idx_categories_parent', async () => {
    const fk = await one<{ confdeltype: string; target: string }>(
      app,
      `SELECT confdeltype, confrelid::regclass::text AS target FROM pg_constraint WHERE conname = 'fk_categories_parent' AND conrelid = 'categories'::regclass`,
    );
    expect(fk).toEqual({ confdeltype: 'r', target: 'categories' });
    const idx = await one<{ n: number }>(app, `SELECT count(*)::int AS n FROM pg_indexes WHERE tablename = 'categories' AND indexname = 'idx_categories_parent'`);
    expect(idx.n).toBe(1);
  });

  it('tạo danh mục con: parentId được lưu; cha không tồn tại → 422 invalid-category', async () => {
    const root = await makeCategory(app);
    const child = await makeCategory(app, { parentId: root.id });
    expect(child.parentId).toBe(root.id);
    const bad = await http(app).post('/v1/categories').set(admin).send({ name: 'Mồ côi', slug: 'mo-coi', parentId: 77777 });
    expect({ status: bad.status, type: bad.body.type }).toEqual({ status: 422, type: 'urn:shop:error:invalid-category' });
    expect((await one<{ n: number }>(app, `SELECT count(*)::int AS n FROM categories WHERE slug = 'mo-coi'`)).n).toBe(0);
  });

  it('?include=children trả các con trực tiếp (sắp theo id), mỗi con chỉ có 4 trường; lá có children rỗng', async () => {
    const root = await makeCategory(app);
    const c1 = await makeCategory(app, { parentId: root.id });
    const c2 = await makeCategory(app, { parentId: root.id });
    await makeCategory(app, { parentId: c1.id }); // cháu: KHÔNG xuất hiện ở cấp con của root
    const res = await http(app).get(`/v1/categories/${root.id}?include=children`).expect(200);
    expect(res.body.children.map((c: { id: number }) => c.id)).toEqual([c1.id, c2.id]);
    expect(Object.keys(res.body.children[0]).sort()).toEqual(['id', 'name', 'parentId', 'slug']);
    const leaf = await http(app).get(`/v1/categories/${c2.id}?include=children`).expect(200);
    expect(leaf.body.children).toEqual([]);
    expect(res.body.products).toBeUndefined();
  });

  it('không include thì không có children/products trong response (không JOIN thừa)', async () => {
    const root = await makeCategory(app);
    await makeCategory(app, { parentId: root.id });
    const res = await http(app).get(`/v1/categories/${root.id}`).expect(200);
    expect(res.body).toEqual({ id: root.id, parentId: null, name: root.name, slug: root.slug });
  });

  it('include giá trị lạ hoặc sai kiểu → 400 problem+json', async () => {
    const root = await makeCategory(app);
    for (const q of ['include=foo', 'include=children,foo', 'include=parent']) {
      const res = await http(app).get(`/v1/categories/${root.id}?${q}`);
      expect({ q, status: res.status }).toEqual({ q, status: 400 });
      expect(res.headers['content-type']).toMatch(/problem\+json/);
    }
    await http(app).get(`/v1/categories/${root.id}?include=children&include=products`).expect(200); // lặp tham số cũng được
  });

  it('xóa danh mục còn con → 409 category-in-use; xóa con trước rồi cha thì được', async () => {
    const root = await makeCategory(app);
    const child = await makeCategory(app, { parentId: root.id });
    const res = await http(app).delete(`/v1/categories/${root.id}`).set(admin).expect(409);
    expect(res.body.type).toBe('urn:shop:error:category-in-use');
    await http(app).delete(`/v1/categories/${child.id}`).set(admin).expect(204);
    await http(app).delete(`/v1/categories/${root.id}`).set(admin).expect(204);
  });

  it('danh mục cha có sản phẩm riêng không bị lẫn với sản phẩm của con khi include=products,children', async () => {
    const root = await makeCategory(app);
    const child = await makeCategory(app, { parentId: root.id });
    const pr = await makeProduct(app, { categoryId: root.id });
    await makeProduct(app, { categoryId: child.id });
    const res = await http(app).get(`/v1/categories/${root.id}?include=children,products`).expect(200);
    expect(res.body.products.map((p: { id: number }) => p.id)).toEqual([pr.id]);
    expect(res.body.children.map((c: { id: number }) => c.id)).toEqual([child.id]);
  });
});
