import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C05 ex02 · DTO cho query của GET /v1/products', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
    await createProduct(app, { name: 'Áo A', price: 100, brand: 'Acme' });
    await createProduct(app, { name: 'Áo B', price: 300, brand: 'Zeta' });
    await createProduct(app, { name: 'Quần C', price: 200, brand: 'Acme' });
  });
  afterAll(async () => {
    await app.close();
  });

  const get = (qs: string) => http(app).get(`/v1/products${qs}`);

  it('mặc định page=1, limit=20, sort=id; kiểu đã được chuyển (meta là số, không phải chuỗi)', async () => {
    const res = await get('').expect(200);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 3 });
  });

  it('chuỗi trong query được chuyển thành số: page=2&limit=2', async () => {
    const res = await get('?page=2&limit=2').expect(200);
    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 3 });
    expect(res.body.data).toHaveLength(1);
  });

  it('lọc + sort cũ vẫn hoạt động', async () => {
    const res = await get('?brand=acme&sort=-price&minPrice=0&q=%C3%A1o').expect(200);
    expect(res.body.data.map((p: { name: string }) => p.name)).toEqual(['Áo A']);
  });

  it.each([
    '?page=0', '?page=abc', '?page=1.5', '?page=', '?limit=0', '?limit=101', '?limit=abc',
    '?sort=password', '?sort=price;drop', '?minPrice=-1', '?minPrice=x', '?maxPrice=1.5',
    '?page=1&page=2', '?q=a&q=b',
  ])('query sai %s → 400', async (qs) => {
    await get(qs).expect(400);
  });

  it('query lạ → 400 và nêu tên tham số', async () => {
    const res = await get('?color=red').expect(400);
    expect((res.body.message as string[]).join(' ')).toContain('color');
  });

  it('v2 dùng cùng DTO: limit=101 → 400', async () => {
    await http(app).get('/v2/products?limit=101').expect(400);
    await http(app).get('/v2/products?limit=2').expect(200);
  });
});
