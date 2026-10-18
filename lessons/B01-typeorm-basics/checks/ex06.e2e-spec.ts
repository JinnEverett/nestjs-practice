import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { dataSourceOf, resetDatabase } from './_db';

const admin = { 'X-Api-Key': process.env.ADMIN_API_KEY ?? 'dev-admin-key' };
let n = 0;
const sku = () => `P06-${String(++n).padStart(4, '0')}-${Date.now().toString(36).toUpperCase()}`.slice(0, 20);
const make = (over: Record<string, unknown> = {}) => ({ sku: sku(), name: 'SP', price: 1000, ...over });

describe('B01 ex06 · Tiền và thời gian đi qua DB không biến dạng', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  beforeEach(async () => {
    await resetDatabase(app);
  });
  afterAll(async () => {
    await app?.close();
  });

  it('price trong response là NUMBER (driver pg trả numeric dạng chuỗi), cả khi tạo, đọc chi tiết, đọc danh sách', async () => {
    const { body: p } = await http(app).post('/v1/products').set(admin).send(make({ price: 199000 })).expect(201);
    expect(p.price).toBe(199000);
    expect((await http(app).get(`/v1/products/${p.id}`).expect(200)).body.price).toBe(199000);
    expect((await http(app).get('/v1/products').expect(200)).body.data[0].price).toBe(199000);
  });

  it('giá 9 chữ số và giá tối đa của numeric(12,0) đi và về nguyên vẹn', async () => {
    for (const price of [9_999_999_999, 999_999_999_999]) {
      const { body: p } = await http(app).post('/v1/products').set(admin).send(make({ price })).expect(201);
      expect((await http(app).get(`/v1/products/${p.id}`).expect(200)).body.price).toBe(price);
    }
  });

  it('giá vượt cột (10^12) và tồn kho/danh mục vượt int4 bị chặn 400 problem+json ở tầng API, KHÔNG phải 500 do DB tràn số', async () => {
    for (const over of [{ price: 1_000_000_000_000 }, { stock: 2_147_483_648 }, { categoryId: 2_147_483_648 }]) {
      const res = await http(app).post('/v1/products').set(admin).send(make(over));
      expect({ over, status: res.status }).toEqual({ over, status: 400 });
      expect(res.headers['content-type']).toMatch(/problem\+json/);
    }
  });

  it('giá lẻ (1999.5) bị từ chối 400: nếu lọt xuống DB, numeric(12,0) sẽ làm tròn âm thầm thành 2000', async () => {
    await http(app).post('/v1/products').set(admin).send(make({ price: 1999.5 })).expect(400);
    const ds = dataSourceOf(app);
    const [row] = (await ds.query(`SELECT 1999.5::numeric(12,0) AS rounded`)) as { rounded: string }[];
    expect(row.rounded).toBe('2000'); // bằng chứng: DB không báo lỗi, chỉ làm tròn
  });

  it('PATCH cũng chặn giá/tồn kho vượt cột bằng 400 (DTO cập nhật thừa kế giới hạn)', async () => {
    const { body: p } = await http(app).post('/v1/products').set(admin).send(make()).expect(201);
    await http(app).patch(`/v1/products/${p.id}`).set(admin).send({ price: 1_000_000_000_000 }).expect(400);
    await http(app).patch(`/v1/products/${p.id}`).set(admin).send({ stock: 2_147_483_648 }).expect(400);
    expect((await http(app).get(`/v1/products/${p.id}`).expect(200)).body.price).toBe(1000);
  });

  it('createdAt là ISO 8601 UTC (kết thúc bằng Z) và khớp thời điểm thật của dòng trong DB', async () => {
    const { body: p } = await http(app).post('/v1/products').set(admin).send(make()).expect(201);
    expect(p.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    const [row] = (await dataSourceOf(app).query(`SELECT (extract(epoch FROM created_at) * 1000)::float8 AS ms FROM products WHERE id = $1`, [p.id])) as { ms: number }[];
    expect(Math.abs(new Date(p.createdAt).getTime() - row.ms)).toBeLessThan(2);
  });

  it('đổi múi giờ của tiến trình Node sang UTC+7 không làm lệch createdAt (bẫy của timestamp KHÔNG múi giờ)', async () => {
    const saved = process.env.TZ;
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    try {
      const other = await createTestApp();
      try {
        const { body: p } = await http(other).post('/v1/products').set(admin).send(make()).expect(201);
        expect(Math.abs(Date.now() - new Date(p.createdAt).getTime())).toBeLessThan(60_000);
        const read = (await http(other).get(`/v1/products/${p.id}`).expect(200)).body;
        expect(Math.abs(Date.now() - new Date(read.createdAt).getTime())).toBeLessThan(60_000);
      } finally {
        await other.close();
      }
    } finally {
      if (saved === undefined) delete process.env.TZ;
      else process.env.TZ = saved;
    }
  });
});
