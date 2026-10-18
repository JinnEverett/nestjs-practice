import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { createProduct, makeProduct } from './factories';
import { cleanDatabase } from './support/clean-db';

const KEY = process.env.ADMIN_API_KEY ?? 'dev-admin-key';

describe('Products (e2e, DB thật)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const ref = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = ref.createNestApplication();
    await configureApp(app);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await cleanDatabase(app); // mỗi test bắt đầu từ DB rỗng: không phụ thuộc test khác
  });

  const rows = async (): Promise<{ id: number; sku: string; price: number; stock: number }[]> =>
    app.get(DataSource).query('SELECT id, sku, price, stock FROM products ORDER BY id');

  describe('POST /v1/products', () => {
    it('tạo → 201, Location, và bản ghi thật sự nằm trong DB', async () => {
      const body = makeProduct({ price: 250_000, stock: 7 });
      const res = await api().post('/v1/products').set('x-api-key', KEY).send(body).expect(201);
      expect(res.headers.location).toBe(`/v1/products/${res.body.id}`);
      expect(await rows()).toEqual([{ id: res.body.id, sku: body.sku, price: 250_000, stock: 7 }]);
    });

    it('thiếu khóa API → 401 và không ghi gì vào DB', async () => {
      await api().post('/v1/products').send(makeProduct()).expect(401);
      expect(await rows()).toEqual([]);
    });

    it('dữ liệu sai → 400 validation, DB không đổi', async () => {
      const res = await api().post('/v1/products').set('x-api-key', KEY).send({ sku: 'x', name: '', price: -1 }).expect(400);
      expect(res.body.type).toBe('urn:shop:error:validation');
      expect(await rows()).toEqual([]);
    });

    it('trùng SKU (khác hoa thường) → 409 duplicate-sku, vẫn chỉ một bản ghi', async () => {
      const first = await createProduct(app, { sku: 'dup-1' });
      const res = await api().post('/v1/products').set('x-api-key', KEY).send(makeProduct({ sku: first.sku.toLowerCase() })).expect(409);
      expect(res.body.type).toBe('urn:shop:error:duplicate-sku');
      expect(await rows()).toHaveLength(1);
    });
  });

  describe('GET /v1/products', () => {
    it('DB rỗng → danh sách rỗng, total 0', async () => {
      const res = await api().get('/v1/products').expect(200);
      expect(res.body).toEqual({ data: [], meta: { page: 1, limit: 20, total: 0 } });
    });

    it('phân trang và sắp xếp ổn định theo id khi giá trùng nhau', async () => {
      const made = [];
      for (const price of [300, 100, 300, 200, 100]) made.push(await createProduct(app, { price }));
      const p1 = await api().get('/v1/products?sort=-price&limit=2&page=1').expect(200);
      const p2 = await api().get('/v1/products?sort=-price&limit=2&page=2').expect(200);
      const p3 = await api().get('/v1/products?sort=-price&limit=2&page=3').expect(200);
      const ids = [...p1.body.data, ...p2.body.data, ...p3.body.data].map((p: { id: number }) => p.id);
      expect(new Set(ids).size).toBe(5);
      expect(ids).toEqual([made[0].id, made[2].id, made[3].id, made[1].id, made[4].id]);
      expect(p1.body.meta.total).toBe(5);
    });

    it('lọc theo brand và khoảng giá', async () => {
      await createProduct(app, { brand: 'Acme', price: 100 });
      const target = await createProduct(app, { brand: 'acme', price: 500 });
      await createProduct(app, { brand: 'Zeta', price: 500 });
      const res = await api().get('/v1/products?brand=ACME&minPrice=200').expect(200);
      expect(res.body.data.map((p: { id: number }) => p.id)).toEqual([target.id]);
    });

    it('tham số sai → 400', async () => {
      await api().get('/v1/products?limit=101').expect(400);
    });
  });

  describe('GET /v1/products/:id', () => {
    it('trả đúng sản phẩm vừa tạo', async () => {
      const p = await createProduct(app, { name: 'Áo thun' });
      const res = await api().get(`/v1/products/${p.id}`).expect(200);
      expect(res.body).toMatchObject({ id: p.id, sku: p.sku, name: 'Áo thun', isActive: true });
    });

    it('id không tồn tại → 404 product-not-found; id sai kiểu → 400', async () => {
      const missing = (await createProduct(app)).id + 1000;
      const res = await api().get(`/v1/products/${missing}`).expect(404);
      expect(res.body).toMatchObject({ type: 'urn:shop:error:product-not-found', productId: missing });
      await api().get('/v1/products/abc').expect(400);
    });
  });

  describe('PATCH /v1/products/:id', () => {
    it('cập nhật một phần và lưu xuống DB', async () => {
      const p = await createProduct(app, { stock: 5, price: 1000 });
      const res = await api().patch(`/v1/products/${p.id}`).set('x-api-key', KEY).send({ price: 2000 }).expect(200);
      expect(res.body.price).toBe(2000);
      expect(await rows()).toEqual([{ id: p.id, sku: p.sku, price: 2000, stock: 5 }]);
    });

    it('null cho field không cho phép null → 400, DB không đổi', async () => {
      const p = await createProduct(app, { stock: 5 });
      await api().patch(`/v1/products/${p.id}`).set('x-api-key', KEY).send({ stock: null }).expect(400);
      expect((await rows())[0].stock).toBe(5);
    });

    it('đổi sang SKU của sản phẩm khác → 409; sản phẩm không có → 404', async () => {
      const a = await createProduct(app);
      const b = await createProduct(app);
      await api().patch(`/v1/products/${a.id}`).set('x-api-key', KEY).send({ sku: b.sku }).expect(409);
      await api().patch(`/v1/products/${b.id + 999}`).set('x-api-key', KEY).send({ price: 1 }).expect(404);
    });
  });

  describe('DELETE /v1/products/:id', () => {
    it('xóa → 204, bản ghi biến mất khỏi DB, đọc lại 404', async () => {
      const p = await createProduct(app);
      await api().delete(`/v1/products/${p.id}`).set('x-api-key', KEY).expect(204);
      expect(await rows()).toEqual([]);
      await api().get(`/v1/products/${p.id}`).expect(404);
    });

    it('không có khóa → 401 và bản ghi còn nguyên', async () => {
      const p = await createProduct(app);
      await api().delete(`/v1/products/${p.id}`).expect(401);
      expect(await rows()).toHaveLength(1);
    });
  });
});
