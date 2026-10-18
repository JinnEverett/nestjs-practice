import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct } from './_fixtures';

describe('C02 ex08 · 🔴 phân trang ổn định khi giá trùng nhau', () => {
  let app: INestApplication;
  const all: number[] = [];
  beforeAll(async () => {
    app = await createTestApp();
    // 7 sản phẩm: 4 cái cùng giá 100, 3 cái cùng giá 200
    for (const price of [100, 200, 100, 200, 100, 200, 100]) all.push((await createProduct(app, { price })).id);
  });
  afterAll(async () => {
    await app.close();
  });

  const pageIds = async (sort: string, page: number) =>
    ((await http(app).get(`/v1/products?sort=${sort}&limit=3&page=${page}`).expect(200)).body.data as { id: number }[]).map((p) => p.id);

  it.each(['price', '-price'])('đi hết các trang với sort=%s: không trùng, không sót', async (sort) => {
    const seen = [...(await pageIds(sort, 1)), ...(await pageIds(sort, 2)), ...(await pageIds(sort, 3))];
    expect(seen).toHaveLength(7);
    expect(new Set(seen).size).toBe(7);
    expect([...seen].sort((a, b) => a - b)).toEqual(all);
  });

  it('khi giá bằng nhau thì id tăng dần (cả khi sort giảm dần)', async () => {
    const asc = (await http(app).get('/v1/products?sort=price').expect(200)).body.data as { id: number; price: number }[];
    expect(asc.map((p) => p.id)).toEqual([all[0], all[2], all[4], all[6], all[1], all[3], all[5]]);
    const desc = (await http(app).get('/v1/products?sort=-price').expect(200)).body.data as { id: number }[];
    expect(desc.map((p) => p.id)).toEqual([all[1], all[3], all[5], all[0], all[2], all[4], all[6]]);
  });

  it('kết quả lặp lại giống hệt giữa các lần gọi', async () => {
    const a = await pageIds('-price', 2);
    const b = await pageIds('-price', 2);
    expect(a).toEqual(b);
  });
});
