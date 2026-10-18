import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C02 ex03 · phân trang + sắp xếp', () => {
  let app: INestApplication;
  const ids: number[] = [];
  beforeAll(async () => {
    app = await createTestApp();
    const prices = [300, 100, 500, 200, 400];
    for (const [i, price] of prices.entries()) {
      ids.push((await createProduct(app, { name: `Hàng ${String.fromCharCode(69 - i)}`, price })).id); // E,D,C,B,A
    }
  });
  afterAll(async () => {
    await app.close();
  });

  const list = async (qs: string) => (await http(app).get(`/v1/products${qs}`).expect(200)).body;

  it('mặc định sắp theo id tăng dần, page=1, limit=20', async () => {
    const body = await list('');
    expect(body.data.map((p: { id: number }) => p.id)).toEqual(ids);
    expect(body.meta).toEqual({ page: 1, limit: 20, total: 5 });
  });

  it('page + limit cắt đúng lát; total vẫn là tổng', async () => {
    const body = await list('?page=2&limit=2');
    expect(body.data.map((p: { id: number }) => p.id)).toEqual([ids[2], ids[3]]);
    expect(body.meta).toEqual({ page: 2, limit: 2, total: 5 });
    expect((await list('?page=9&limit=2')).data).toEqual([]);
  });

  it('sort=price tăng, sort=-price giảm, sort=name theo chữ cái', async () => {
    expect((await list('?sort=price')).data.map((p: { price: number }) => p.price)).toEqual([100, 200, 300, 400, 500]);
    expect((await list('?sort=-price')).data.map((p: { price: number }) => p.price)).toEqual([500, 400, 300, 200, 100]);
    expect((await list('?sort=name')).data.map((p: { name: string }) => p.name)).toEqual([
      'Hàng A', 'Hàng B', 'Hàng C', 'Hàng D', 'Hàng E',
    ]);
  });

  it('sắp xếp không làm đổi thứ tự lưu trữ (không sort tại chỗ)', async () => {
    await list('?sort=-price');
    expect((await list('')).data.map((p: { id: number }) => p.id)).toEqual(ids);
  });

  it('tham số sai → 400', async () => {
    for (const qs of ['?page=0', '?page=-1', '?page=abc', '?page=1.5', '?limit=0', '?limit=101', '?limit=abc', '?sort=password', '?sort=-']) {
      await http(app).get(`/v1/products${qs}`).expect(400);
    }
  });

  it('limit=100 là biên hợp lệ', async () => {
    await http(app).get('/v1/products?limit=100').expect(200);
  });
});
