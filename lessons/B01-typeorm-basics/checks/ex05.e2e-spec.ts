import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { dataSourceOf, resetDatabase } from './_db';
import { PRODUCTS_REPOSITORY } from '../../src/products/products.repository';

const admin = { 'X-Api-Key': process.env.ADMIN_API_KEY ?? 'dev-admin-key' };
let n = 0;
const body = (over: Record<string, unknown> = {}) => ({ sku: `P05-${Date.now().toString(36).toUpperCase()}-${++n}`.slice(0, 20), name: 'Áo thun', price: 199000, stock: 5, ...over });

describe('B01 ex05 · Repository thật thay bản in-memory', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
    await resetDatabase(app);
  });
  afterAll(async () => {
    await app?.close();
  });

  it('PRODUCTS_REPOSITORY (giữ nguyên token và interface của C03) không còn là bản in-memory', () => {
    const repo = app.get(PRODUCTS_REPOSITORY, { strict: false }) as object;
    expect(repo.constructor.name).not.toMatch(/in-?memory/i);
  });

  it('POST tạo 201 + Location và dòng thật xuất hiện trong bảng products với đúng giá trị cột', async () => {
    const b = body({ brand: 'Acme', attributes: { color: 'đen' } });
    const res = await http(app).post('/v1/products').set(admin).send(b).expect(201);
    expect(res.headers.location).toMatch(new RegExp(`/v1/products/${res.body.id}$`));
    const [row] = (await dataSourceOf(app).query('SELECT * FROM products WHERE id = $1', [res.body.id])) as Record<string, unknown>[];
    expect(row).toMatchObject({ sku: b.sku, name: 'Áo thun', brand: 'Acme', price: '199000', stock: 5, is_active: true, attributes: { color: 'đen' } });
  });

  it('PATCH đổi đúng cột trong DB, DELETE xóa dòng; 404 cho id không tồn tại', async () => {
    const ds = dataSourceOf(app);
    const { body: p } = await http(app).post('/v1/products').set(admin).send(body()).expect(201);
    await http(app).patch(`/v1/products/${p.id}`).set(admin).send({ price: 250000, stock: 9 }).expect(200);
    const [row] = (await ds.query('SELECT price, stock, name FROM products WHERE id = $1', [p.id])) as Record<string, unknown>[];
    expect(row).toEqual({ price: '250000', stock: 9, name: 'Áo thun' });
    await http(app).delete(`/v1/products/${p.id}`).set(admin).expect(204);
    expect(((await ds.query('SELECT count(*)::int AS n FROM products WHERE id = $1', [p.id])) as { n: number }[])[0].n).toBe(0);
    await http(app).get(`/v1/products/${p.id}`).expect(404);
    await http(app).patch('/v1/products/99999999').set(admin).send({ stock: 1 }).expect(404);
    await http(app).delete('/v1/products/99999999').set(admin).expect(404);
  });

  it('PATCH rỗng ({}) không làm hỏng gì và trả lại sản phẩm hiện tại', async () => {
    const { body: p } = await http(app).post('/v1/products').set(admin).send(body({ name: 'Giữ nguyên' })).expect(201);
    const res = await http(app).patch(`/v1/products/${p.id}`).set(admin).send({}).expect(200);
    expect(res.body).toMatchObject({ id: p.id, name: 'Giữ nguyên' });
  });

  it('dữ liệu CÒN SAU KHI KHỞI ĐỘNG LẠI ứng dụng (khác bản in-memory)', async () => {
    await resetDatabase(app);
    const created = [] as { id: number; sku: string }[];
    for (let i = 0; i < 3; i++) created.push((await http(app).post('/v1/products').set(admin).send(body({ name: `Bền ${i}` })).expect(201)).body);
    await app.close();

    app = await createTestApp(); // tiến trình "mới": RAM trống, chỉ còn Postgres
    const res = await http(app).get('/v1/products?limit=100&sort=id').expect(200);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.data.map((p: { id: number; sku: string }) => [p.id, p.sku])).toEqual(created.map((p) => [p.id, p.sku]));
  });

  it('sau resetDatabase (TRUNCATE ... RESTART IDENTITY) id sinh ra bắt đầu lại từ 1', async () => {
    await resetDatabase(app);
    const { body: p } = await http(app).post('/v1/products').set(admin).send(body()).expect(201);
    expect(p.id).toBe(1);
  });

  it('lọc, sắp xếp và phân trang (C02) vẫn đúng trên dữ liệu thật', async () => {
    await resetDatabase(app);
    for (const [price, brand] of [[300000, 'Acme'], [100000, 'Acme'], [200000, 'Zeta']] as const) await http(app).post('/v1/products').set(admin).send(body({ price, brand })).expect(201);
    const res = await http(app).get('/v1/products?brand=acme&sort=-price&limit=1&page=1').expect(200);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 1, total: 2 });
    expect(res.body.data.map((p: { price: number }) => p.price)).toEqual([300000]);
  });
});
