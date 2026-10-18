import { INestApplication } from '@nestjs/common';
import { createTestApp, http, readSource } from './_kit';

describe('C05 ex01 · ValidationPipe toàn cục + CreateProductDto', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  const post = (body: unknown) => http(app).post('/v1/products').send(body as object);
  const messages = (res: { body: { message: unknown } }) => (res.body.message as string[]).join(' | ');

  it('ValidationPipe được đăng ký trong configureApp', () => {
    expect(readSource('src', 'app.setup.ts')).toMatch(/ValidationPipe/);
  });

  it('body hợp lệ → 201; sku/name được chuẩn hóa', async () => {
    const res = await post({ sku: ' ao-01 ', name: '  Áo  ', price: 150000, brand: null }).expect(201);
    expect(res.body).toMatchObject({ sku: 'AO-01', name: 'Áo', price: 150000, brand: null });
  });

  it('thiếu trường bắt buộc → 400, message là mảng, mỗi lỗi nêu tên field', async () => {
    const res = await post({}).expect(400);
    expect(Array.isArray(res.body.message)).toBe(true);
    const all = messages(res);
    for (const f of ['sku', 'name', 'price']) expect(all).toContain(f);
    expect(res.body.statusCode).toBe(400);
  });

  it.each([
    ['sku sai định dạng', { sku: 'a b', name: 'x', price: 1 }, 'sku'],
    ['sku quá ngắn', { sku: 'AB', name: 'x', price: 1 }, 'sku'],
    ['name rỗng sau trim', { sku: 'OK-1', name: '   ', price: 1 }, 'name'],
    ['name quá dài', { sku: 'OK-1', name: 'x'.repeat(121), price: 1 }, 'name'],
    ['price âm', { sku: 'OK-1', name: 'x', price: -1 }, 'price'],
    ['price lẻ', { sku: 'OK-1', name: 'x', price: 10.5 }, 'price'],
    ['price là chuỗi', { sku: 'OK-1', name: 'x', price: '100' }, 'price'],
    ['stock âm', { sku: 'OK-1', name: 'x', price: 1, stock: -1 }, 'stock'],
    ['categoryId = 0', { sku: 'OK-1', name: 'x', price: 1, categoryId: 0 }, 'categoryId'],
    ['attributes là mảng', { sku: 'OK-1', name: 'x', price: 1, attributes: [] }, 'attributes'],
    ['isActive là chuỗi', { sku: 'OK-1', name: 'x', price: 1, isActive: 'yes' }, 'isActive'],
    ['brand là số', { sku: 'OK-1', name: 'x', price: 1, brand: 5 }, 'brand'],
  ])('%s → 400', async (_n, body, field) => {
    const res = await post(body).expect(400);
    expect(messages(res)).toContain(field);
  });

  it('field lạ → 400 (forbidNonWhitelisted) và nêu tên field lạ', async () => {
    const res = await post({ sku: 'OK-2', name: 'x', price: 1, role: 'admin' }).expect(400);
    expect(messages(res)).toContain('role');
  });

  it('tất cả lỗi được báo một lượt (không dừng ở lỗi đầu tiên)', async () => {
    const res = await post({ sku: '!', name: '', price: -5 }).expect(400);
    expect((res.body.message as string[]).length).toBeGreaterThanOrEqual(3);
  });
});
