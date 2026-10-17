import { readdirSync, readFileSync } from 'node:fs';
import { INestApplication } from '@nestjs/common';
import { createTestApp, http, repoPath } from './_kit';
import { createProduct } from './_fixtures';

describe('C05 ex06 · validator tùy biến: minPrice <= maxPrice', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
    await createProduct(app, { price: 100 });
    await createProduct(app, { price: 300 });
  });
  afterAll(async () => {
    await app.close();
  });

  it('minPrice > maxPrice → 400 và message nhắc minPrice', async () => {
    const res = await http(app).get('/v1/products?minPrice=500&maxPrice=100').expect(400);
    expect((res.body.message as string[]).join(' ')).toContain('minPrice');
  });

  it('bằng nhau, hoặc chỉ có một vế, hoặc minPrice=0 → hợp lệ', async () => {
    expect((await http(app).get('/v1/products?minPrice=100&maxPrice=100').expect(200)).body.meta.total).toBe(1);
    expect((await http(app).get('/v1/products?minPrice=300').expect(200)).body.meta.total).toBe(1);
    expect((await http(app).get('/v1/products?maxPrice=0').expect(200)).body.meta.total).toBe(0);
    expect((await http(app).get('/v1/products?minPrice=0&maxPrice=0').expect(200)).body.meta.total).toBe(0);
  });

  it('v2 cũng áp dụng', async () => {
    await http(app).get('/v2/products?minPrice=5&maxPrice=1').expect(400);
  });

  it('có file validator dùng lại được: src/common/validators/ có ít nhất một file .ts dùng registerDecorator hoặc ValidatorConstraint', () => {
    const dir = repoPath('src', 'common', 'validators');
    const found = readdirSync(dir).some((f) => /registerDecorator|ValidatorConstraint/.test(readFileSync(`${dir}/${f}`, 'utf8')));
    expect(found).toBe(true);
  });
});
