import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C02 ex04 · lọc brand/minPrice/maxPrice/q', () => {
  let app: INestApplication;
  const names = async (qs: string) =>
    ((await http(app).get(`/v1/products${qs}`).expect(200)).body.data as { name: string }[]).map((p) => p.name);

  beforeAll(async () => {
    app = await createTestApp();
    await createProduct(app, { name: 'Áo thun cotton', brand: 'Acme', price: 0 });
    await createProduct(app, { name: 'Quần jeans (slim)', brand: 'acme', price: 300000 });
    await createProduct(app, { name: 'Giày chạy bộ', brand: 'Zeta', price: 900000 });
    await createProduct(app, { name: 'Mũ lưỡi trai', brand: null, price: 120000 });
  });
  afterAll(async () => {
    await app.close();
  });

  it('brand so khớp đầy đủ, không phân biệt hoa thường; sản phẩm brand=null không khớp', async () => {
    expect(await names('?brand=ACME')).toEqual(['Áo thun cotton', 'Quần jeans (slim)']);
    expect(await names('?brand=Ac')).toEqual([]);
  });

  it('minPrice/maxPrice bao gồm biên, và 0 là giá trị hợp lệ (không bị coi là "không lọc")', async () => {
    expect(await names('?maxPrice=0')).toEqual(['Áo thun cotton']);
    expect(await names('?minPrice=120000&maxPrice=300000')).toEqual(['Quần jeans (slim)', 'Mũ lưỡi trai']);
    expect(await names('?minPrice=900001')).toEqual([]);
  });

  it('q tìm theo tên, không phân biệt hoa thường, ký tự đặc biệt được hiểu nguyên văn', async () => {
    expect(await names('?q=THUN')).toEqual(['Áo thun cotton']);
    expect(await names('?q=(slim)')).toEqual(['Quần jeans (slim)']);
    expect(await names('?q=(')).toEqual(['Quần jeans (slim)']);
    expect(await names('?q=.*')).toEqual([]);
  });

  it('kết hợp bộ lọc + phân trang: total đếm sau khi lọc', async () => {
    const body = (await http(app).get('/v1/products?brand=acme&limit=1&page=2').expect(200)).body;
    expect(body.data.map((p: { name: string }) => p.name)).toEqual(['Quần jeans (slim)']);
    expect(body.meta).toEqual({ page: 2, limit: 1, total: 2 });
  });

  it('giá trị lọc sai → 400', async () => {
    for (const qs of ['?minPrice=abc', '?maxPrice=1.5', '?minPrice=500&maxPrice=100']) {
      await http(app).get(`/v1/products${qs}`).expect(400);
    }
  });
});
