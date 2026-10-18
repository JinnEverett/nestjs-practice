import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './_kit';
import { dataSourceOf, pgErrorCode, rebuildSchema, resetDatabase } from './_db';
import { constraintsOf, describeTable } from './_schema';

describe('B01 ex02 · Bảng products đúng kiểu cột và ràng buộc', () => {
  let app: INestApplication;
  let ds: DataSource;
  beforeAll(async () => {
    app = await createTestApp();
    ds = dataSourceOf(app);
    await rebuildSchema(app); // chấm trên schema mới tinh, không bị lệch bởi DB còn sót từ lần chạy trước
  });
  beforeEach(async () => {
    await resetDatabase(app);
  });
  afterAll(async () => {
    await app?.close();
  });

  it('cột và kiểu đúng: tiền là numeric(12,0), thời gian là timestamptz, thuộc tính là jsonb', async () => {
    expect(await describeTable(ds, 'products')).toEqual({
      id: 'integer',
      category_id: 'integer',
      sku: 'varchar(20)',
      name: 'varchar(120)',
      brand: 'varchar(80)?',
      price: 'numeric(12,0)',
      stock: 'integer',
      attributes: 'jsonb',
      is_active: 'boolean',
      created_at: 'timestamptz',
    });
  });

  it('tên ràng buộc đặt tường minh: uq_products_sku (UNIQUE) và ck_products_* (CHECK)', async () => {
    const c = await constraintsOf(ds, 'products');
    expect(c.uq_products_sku).toBe('u');
    for (const name of ['ck_products_sku_format', 'ck_products_price', 'ck_products_stock']) expect({ name, type: c[name] }).toEqual({ name, type: 'c' });
  });

  it('chèn thiếu cột có mặc định: attributes = {}, is_active = true, stock = 0, category_id = 1, created_at = bây giờ', async () => {
    const [row] = (await ds.query(`INSERT INTO products (sku, name, price) VALUES ('X-1', 'n', 10) RETURNING *`)) as Record<string, unknown>[];
    expect(row.attributes).toEqual({});
    expect(row.is_active).toBe(true);
    expect(row.stock).toBe(0);
    expect(row.category_id).toBe(1);
    expect(Math.abs(Date.now() - new Date(row.created_at as string).getTime())).toBeLessThan(60_000);
  });

  it('SKU trùng bị DB từ chối (23505) dù ghi bằng SQL thẳng, không qua API', async () => {
    await ds.query(`INSERT INTO products (sku, name, price) VALUES ('DUP-1', 'a', 1)`);
    expect(await pgErrorCode(ds.query(`INSERT INTO products (sku, name, price) VALUES ('DUP-1', 'b', 2)`))).toBe('23505');
  });

  it.each([
    ['giá âm', `INSERT INTO products (sku, name, price) VALUES ('NEG-1', 'a', -1)`],
    ['tồn kho âm', `INSERT INTO products (sku, name, price, stock) VALUES ('NEG-2', 'a', 1, -5)`],
    ['SKU sai định dạng (chữ thường)', `INSERT INTO products (sku, name, price) VALUES ('abc-1', 'a', 1)`],
    ['SKU quá ngắn', `INSERT INTO products (sku, name, price) VALUES ('AB', 'a', 1)`],
  ])('CHECK chặn %s (23514)', async (_label, sql) => {
    expect(await pgErrorCode(ds.query(sql))).toBe('23514');
  });

  it('numeric(12,0) tràn thì lỗi 22003; giá trị tối đa 999999999999 thì lưu được', async () => {
    expect(await pgErrorCode(ds.query(`INSERT INTO products (sku, name, price) VALUES ('BIG-1', 'a', 1000000000000)`))).toBe('22003');
    await ds.query(`INSERT INTO products (sku, name, price) VALUES ('BIG-2', 'a', 999999999999)`);
  });

  it('name dài 121 ký tự bị từ chối (22001), brand dài 81 ký tự bị từ chối', async () => {
    expect(await pgErrorCode(ds.query(`INSERT INTO products (sku, name, price) VALUES ('LEN-1', repeat('x', 121), 1)`))).toBe('22001');
    expect(await pgErrorCode(ds.query(`INSERT INTO products (sku, name, price, brand) VALUES ('LEN-2', 'a', 1, repeat('x', 81))`))).toBe('22001');
  });
});
