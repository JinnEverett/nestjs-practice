import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, http } from './_kit';
import { admin } from './_b02';
import { dataSourceOf, pgErrorCode, freshDatabase, resetDatabase } from './_db';
import { describeTable } from './_schema';

describe('B02 ex04 · Quan hệ 1-1 và khóa ngoại phía đơn hàng', () => {
  let app: INestApplication;
  let ds: DataSource;
  beforeAll(async () => {
    await freshDatabase();
    app = await createTestApp();
    ds = dataSourceOf(app);
  });
  beforeEach(async () => {
    await resetDatabase(app);
  });
  afterAll(async () => {
    await app?.close();
  });

  const user = async (email = 'a@example.com'): Promise<number> => ((await ds.query(`INSERT INTO users (email, full_name) VALUES ($1, 'A') RETURNING id`, [email])) as { id: number }[])[0].id;
  const order = async (userId: number): Promise<number> => ((await ds.query(`INSERT INTO orders (user_id, total_amount) VALUES ($1, 100) RETURNING id`, [userId])) as { id: number }[])[0].id;
  const product = async (sku: string): Promise<number> => {
    await ds.query(`INSERT INTO categories (id, name, slug) VALUES (1, 'x', 'x') ON CONFLICT DO NOTHING`);
    return ((await ds.query(`INSERT INTO products (sku, name, price) VALUES ($1, 'p', 1) RETURNING id`, [sku])) as { id: number }[])[0].id;
  };

  it('user_profiles: khóa chính chính là user_id; cột phone/address cho phép NULL', async () => {
    expect(await describeTable(ds, 'user_profiles')).toEqual({ user_id: 'integer', phone: 'varchar(20)?', address: 'varchar(255)?', updated_at: 'timestamptz' });
    const pk = (await ds.query(`SELECT a.attname FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey) WHERE c.conrelid = 'user_profiles'::regclass AND c.contype = 'p'`)) as { attname: string }[];
    expect(pk.map((r) => r.attname)).toEqual(['user_id']);
  });

  it('metadata ORM: quan hệ UserProfile → User là one-to-one, bên sở hữu, join qua user_id', () => {
    const meta = ds.entityMetadatas.find((m) => m.tableName === 'user_profiles');
    expect(meta).toBeDefined();
    const rel = meta!.relations.find((r) => r.inverseEntityMetadata.tableName === 'users');
    expect(rel).toBeDefined();
    expect(rel!.relationType).toBe('one-to-one');
    expect(rel!.isOwning).toBe(true);
    expect(rel!.joinColumns.map((c) => c.databaseName)).toEqual(['user_id']);
    const inverse = ds.entityMetadatas.find((m) => m.tableName === 'users')!.relations.find((r) => r.inverseEntityMetadata.tableName === 'user_profiles');
    expect(inverse?.relationType).toBe('one-to-one');
    expect(inverse?.isOwning).toBe(false);
  });

  it('1-1 được DB bảo đảm: một người dùng chỉ có một hồ sơ (23505), hồ sơ cho người dùng không tồn tại bị từ chối (23503), xóa người dùng kéo theo hồ sơ', async () => {
    const u = await user();
    await ds.query(`INSERT INTO user_profiles (user_id, phone) VALUES ($1, '0900000000')`, [u]);
    expect(await pgErrorCode(ds.query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [u]))).toBe('23505');
    expect(await pgErrorCode(ds.query(`INSERT INTO user_profiles (user_id) VALUES (99999)`))).toBe('23503');
    await ds.query('DELETE FROM users WHERE id = $1', [u]);
    expect(((await ds.query('SELECT count(*)::int AS n FROM user_profiles')) as { n: number }[])[0].n).toBe(0);
  });

  it('orders.user_id: đơn của người dùng không tồn tại bị chặn (23503); không xóa được người dùng còn đơn (23001: RESTRICT)', async () => {
    expect(await pgErrorCode(ds.query(`INSERT INTO orders (user_id, total_amount) VALUES (99999, 1)`))).toBe('23503');
    const u = await user();
    await order(u);
    expect(await pgErrorCode(ds.query('DELETE FROM users WHERE id = $1', [u]))).toBe('23001'); // RESTRICT: mã 23001, khác 23503
  });

  it('order_items: phải thuộc đơn có thật và sản phẩm có thật; xóa đơn kéo theo dòng hàng (CASCADE); xóa sản phẩm đã vào đơn bị chặn (RESTRICT, 23001)', async () => {
    const u = await user();
    const o = await order(u);
    const p = await product('ITEM-1');
    expect(await pgErrorCode(ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (99999, $1, 1, 1)`, [p]))).toBe('23503');
    expect(await pgErrorCode(ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, 99999, 1, 1)`, [o]))).toBe('23503');
    await ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, 2, 100)`, [o, p]);
    expect(await pgErrorCode(ds.query('DELETE FROM products WHERE id = $1', [p]))).toBe('23001');
    await ds.query('DELETE FROM orders WHERE id = $1', [o]);
    expect(((await ds.query('SELECT count(*)::int AS n FROM order_items')) as { n: number }[])[0].n).toBe(0);
    await ds.query('DELETE FROM products WHERE id = $1', [p]); // hết ràng buộc thì xóa được
  });

  it('qua API: xóa sản phẩm đã nằm trong order_items → 409 (không phải 500 và không mất sản phẩm); chưa nằm trong đơn thì 204', async () => {
    const u = await user();
    const o = await order(u);
    const p = await product('API-DEL-1');
    await ds.query(`INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ($1, $2, 1, 1)`, [o, p]);
    const res = await http(app).delete(`/v1/products/${p}`).set(admin);
    expect({ status: res.status, ct: res.headers['content-type'] }).toEqual({ status: 409, ct: expect.stringMatching(/problem\+json/) });
    expect(((await ds.query('SELECT count(*)::int AS n FROM products WHERE id = $1', [p])) as { n: number }[])[0].n).toBe(1);
    const free = await product('API-DEL-2');
    await http(app).delete(`/v1/products/${free}`).set(admin).expect(204);
  });

  it('payments: gắn với đơn có thật; xóa đơn đã có thanh toán bị chặn (RESTRICT, 23001): chứng từ không biến mất', async () => {
    const o = await order(await user());
    expect(await pgErrorCode(ds.query(`INSERT INTO payments (order_id, method, status, amount) VALUES (99999, 'card', 'succeeded', 1)`))).toBe('23503');
    await ds.query(`INSERT INTO payments (order_id, method, status, amount) VALUES ($1, 'card', 'succeeded', 100)`, [o]);
    expect(await pgErrorCode(ds.query('DELETE FROM orders WHERE id = $1', [o]))).toBe('23001');
  });

  it('mọi khóa ngoại đều có index với cột đầu là cột khóa ngoại (Postgres KHÔNG tự tạo; thiếu thì JOIN và kiểm tra RESTRICT quét cả bảng)', async () => {
    const missing = (await ds.query(
      `SELECT c.conrelid::regclass::text AS tbl, a.attname AS col
         FROM pg_constraint c
         JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = c.conkey[1]
        WHERE c.contype = 'f' AND c.connamespace = 'public'::regnamespace
          AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND i.indkey[0] = c.conkey[1])`,
    )) as { tbl: string; col: string }[];
    expect(missing).toEqual([]);
  });

  it('mọi khóa ngoại đặt tên fk_<bảng>_<ý> (không phải tên băm tự sinh)', async () => {
    const names = ((await ds.query(`SELECT conname FROM pg_constraint WHERE contype = 'f' AND connamespace = 'public'::regnamespace`)) as { conname: string }[]).map((r) => r.conname);
    expect(names.length).toBeGreaterThanOrEqual(9);
    expect(names.filter((n) => !/^fk_[a-z_]+$/.test(n))).toEqual([]);
  });
});
