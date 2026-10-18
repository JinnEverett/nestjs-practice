import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { createProduct } from './factories';
import { cleanDatabase } from './support/clean-db';

const KEY = process.env.ADMIN_API_KEY ?? 'dev-admin-key';

describe('products (đã sửa flaky)', () => {
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
    await cleanDatabase(app); // trạng thái đầu của mỗi test do chính nó dựng: chạy riêng, ngẫu nhiên thứ tự hay song song đều đúng
  });

  it('tạo sản phẩm', async () => {
    const res = await api().post('/v1/products').set('x-api-key', KEY).send({ sku: 'FLAKY-1', name: 'Áo', price: 1000, stock: 4 });
    expect(res.status).toBe(201);
    expect(res.body.sku).toBe('FLAKY-1'); // không giả định id cụ thể
    expect(Number.isInteger(res.body.id)).toBe(true);
  });

  it('đọc lại sản phẩm do chính test này tạo', async () => {
    const p = await createProduct(app, { sku: 'FLAKY-2' });
    const res = await api().get(`/v1/products/${p.id}`);
    expect(res.status).toBe(200);
    expect(res.body.sku).toBe('FLAKY-2');
  });

  it('danh sách phản ánh đúng số sản phẩm test này đã tạo', async () => {
    await createProduct(app);
    const res = await api().get('/v1/products');
    expect(res.body.meta.total).toBe(1);
  });

  it('tồn kho không đổi giữa hai lần đọc (không cần chờ: không có gì bất đồng bộ ở đây)', async () => {
    const p = await createProduct(app, { stock: 4 });
    const a = await api().get(`/v1/products/${p.id}`);
    const b = await api().get(`/v1/products/${p.id}`);
    expect(a.body.stock).toBe(4);
    expect(b.body.stock).toBe(4);
  });

  it('xóa sản phẩm của chính test này', async () => {
    const p = await createProduct(app);
    await api().delete(`/v1/products/${p.id}`).set('x-api-key', KEY).expect(204);
    await api().get(`/v1/products/${p.id}`).expect(404);
  });
});
