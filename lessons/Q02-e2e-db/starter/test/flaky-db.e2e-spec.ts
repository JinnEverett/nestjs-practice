import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

// Bộ test này "chạy được" trên máy tác giả khi DB vừa tạo, đỏ ở CI. Hãy sửa (ex05).
describe('products (flaky)', () => {
  let app: INestApplication;
  let created: { id: number; sku: string };

  beforeAll(async () => {
    const ref = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = ref.createNestApplication();
    await configureApp(app);
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });

  it('tạo sản phẩm', async () => {
    const res = await request(app.getHttpServer()).post('/v1/products').set('x-api-key', 'dev-admin-key').send({ sku: 'FLAKY-1', name: 'Áo', price: 1000, stock: 4 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    created = res.body;
  });

  it('đọc lại sản phẩm vừa tạo', async () => {
    const res = await request(app.getHttpServer()).get('/v1/products/1');
    expect(res.status).toBe(200);
    expect(res.body.sku).toBe(created.sku);
  });

  it('danh sách có đúng 1 sản phẩm', async () => {
    const res = await request(app.getHttpServer()).get('/v1/products');
    expect(res.body.meta.total).toBe(1);
  });

  it('sau khi chờ một chút, tồn kho vẫn là 4', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const res = await request(app.getHttpServer()).get('/v1/products/1');
    expect(res.body.stock).toBe(4);
  });

  it('xóa sản phẩm số 1', async () => {
    await request(app.getHttpServer()).delete('/v1/products/1').set('x-api-key', 'dev-admin-key').expect(204);
    await request(app.getHttpServer()).get('/v1/products/1').expect(404);
  });
});
