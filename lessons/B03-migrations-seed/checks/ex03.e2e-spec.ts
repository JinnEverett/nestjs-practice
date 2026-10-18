import { DataSource } from 'typeorm';
import { pgErrorCode } from './_db';
import { freshDatabase } from './_db';
import { openProjectDataSource, revertDownTo, one } from './_b03';

jest.setTimeout(180_000);

describe('B03 ex03 · Thêm cột NOT NULL vào bảng ĐANG CÓ DỮ LIỆU (products.weight_grams)', () => {
  let ds: DataSource;
  beforeAll(async () => {
    await freshDatabase();
    ds = await openProjectDataSource();
    await ds.runMigrations();
  });
  afterAll(async () => {
    await ds?.destroy();
  });

  it('cột products.weight_grams: integer, NOT NULL, mặc định 0; ràng buộc ck_products_weight (>= 0) đã được VALIDATE', async () => {
    const col = await one<{ data_type: string; is_nullable: string; column_default: string }>(
      ds,
      `SELECT data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight_grams'`,
    );
    expect(col).toMatchObject({ data_type: 'integer', is_nullable: 'NO' });
    expect(col.column_default).toMatch(/^0\b/);
    const ck = await one<{ convalidated: boolean }>(ds, `SELECT convalidated FROM pg_constraint WHERE conname = 'ck_products_weight' AND conrelid = 'products'::regclass`);
    expect(ck).toEqual({ convalidated: true });
    expect(await pgErrorCode(ds.query(`INSERT INTO categories (id, name, slug) VALUES (1, 'x', 'x') ON CONFLICT DO NOTHING`).then(() => ds.query(`INSERT INTO products (sku, name, price, weight_grams) VALUES ('W-NEG', 'x', 1, -1)`)))).toBe('23514');
  });

  it('áp dụng LÊN dữ liệu có sẵn: lùi về migration đầu, chèn 2000 sản phẩm theo schema cũ, rồi chạy tiếp: không lỗi, mọi dòng có weight_grams = 0, dữ liệu cũ nguyên vẹn', async () => {
    await revertDownTo(ds, 1); // chỉ còn InitialSchema
    expect(((await ds.query(`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight_grams'`)) as { n: number }[])[0].n).toBe(0);
    await ds.query(`INSERT INTO categories (id, name, slug) VALUES (1, 'x', 'x') ON CONFLICT DO NOTHING`);
    await ds.query(`INSERT INTO products (sku, name, price, stock) SELECT 'OLD-' || g, 'Cũ ' || g, 1000 * g, g % 50 FROM generate_series(1, 2000) g`);
    await ds.runMigrations();
    const stats = await one<{ n: number; zero: number; nulls: number; sum_price: string }>(
      ds,
      `SELECT count(*)::int AS n, count(*) FILTER (WHERE weight_grams = 0)::int AS zero, count(*) FILTER (WHERE weight_grams IS NULL)::int AS nulls, sum(price)::text AS sum_price FROM products`,
    );
    expect(stats).toEqual({ n: 2000, zero: 2000, nulls: 0, sum_price: String((2000 * 2001) / 2 * 1000) });
  });

  it('lùi migration này gỡ cột và ràng buộc mà không động tới dữ liệu khác; chạy lại thì cột trở lại', async () => {
    const before = await one<{ n: number; sum_price: string }>(ds, `SELECT count(*)::int AS n, sum(price)::text AS sum_price FROM products`);
    await revertDownTo(ds, 1);
    expect(((await ds.query(`SELECT count(*)::int AS n FROM pg_constraint WHERE conname = 'ck_products_weight'`)) as { n: number }[])[0].n).toBe(0);
    expect(await one(ds, `SELECT count(*)::int AS n, sum(price)::text AS sum_price FROM products`)).toEqual(before);
    await ds.runMigrations();
    expect(((await ds.query(`SELECT count(*)::int AS n FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'weight_grams'`)) as { n: number }[])[0].n).toBe(1);
  });

  it('entity ProductEntity có thuộc tính weightGrams ánh xạ cột weight_grams (schema và entity cùng một sự thật)', () => {
    const meta = ds.entityMetadatas.find((m) => m.tableName === 'products')!;
    const col = meta.columns.find((c) => c.propertyName === 'weightGrams');
    expect(col?.databaseName).toBe('weight_grams');
    expect(col?.isNullable).toBe(false);
  });
});
