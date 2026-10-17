import { INestApplication } from '@nestjs/common';
import { createTestApp, fileExists, http } from './_kit';

describe('C01 ex04 · nest g resource products', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it.each([
    ['src', 'products', 'products.module.ts'],
    ['src', 'products', 'products.controller.ts'],
    ['src', 'products', 'products.service.ts'],
    ['src', 'products', 'dto', 'create-product.dto.ts'],
    ['src', 'products', 'dto', 'update-product.dto.ts'],
    ['src', 'products', 'entities', 'product.entity.ts'],
  ])('tồn tại %s/%s', (...parts) => {
    expect(fileExists(...parts)).toBe(true);
  });

  it('GET /products → 200', async () => {
    await http(app).get('/products').expect(200);
  });
  it('GET /products/1 → 200', async () => {
    await http(app).get('/products/1').expect(200);
  });
  it('POST /products → 201', async () => {
    await http(app).post('/products').send({}).expect(201);
  });
  it('PATCH và DELETE /products/1 → 200', async () => {
    await http(app).patch('/products/1').send({}).expect(200);
    await http(app).delete('/products/1').expect(200);
  });
});
