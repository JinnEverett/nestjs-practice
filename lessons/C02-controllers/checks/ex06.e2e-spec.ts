import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C02 ex06 · v2 và wildcard', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
    for (let i = 0; i < 5; i++) await createProduct(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it('GET /v2/products trả {items, pagination:{page,limit,total,pages}}', async () => {
    const res = await http(app).get('/v2/products?limit=2&page=3').expect(200);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.pagination).toEqual({ page: 3, limit: 2, total: 5, pages: 3 });
    expect(res.body.data).toBeUndefined();
  });

  it('v2 dùng cùng bộ lọc/sort với v1', async () => {
    const res = await http(app).get('/v2/products?sort=-id&limit=1').expect(200);
    const v1 = await http(app).get('/v1/products?sort=-id&limit=1').expect(200);
    expect(res.body.items).toEqual(v1.body.data);
  });

  it('v1 vẫn giữ nguyên hình dạng cũ', async () => {
    const res = await http(app).get('/v1/products').expect(200);
    expect(Object.keys(res.body).sort()).toEqual(['data', 'meta']);
  });

  it('v2 chỉ có danh sách: /v2/products/1 → 404', async () => {
    await http(app).get('/v2/products/1').expect(404);
  });

  it('/v1/legacy/** (mọi method, mọi độ sâu) → 410 Gone', async () => {
    await http(app).get('/v1/legacy/old/path').expect(410);
    await http(app).post('/v1/legacy/x').send({}).expect(410);
    await http(app).delete('/v1/legacy/a/b/c/d').expect(410);
  });
});
