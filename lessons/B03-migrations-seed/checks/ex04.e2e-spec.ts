import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { freshDatabase } from './_db';
import { repoPath } from './_kit';
import { one, openProjectDataSource, revertDownTo } from './_b03';

jest.setTimeout(180_000);

describe('B03 ex04 · Tạo index mà không chặn ghi: CREATE INDEX CONCURRENTLY và transaction = false', () => {
  let ds: DataSource;
  beforeAll(async () => {
    await freshDatabase();
    ds = await openProjectDataSource();
    await ds.runMigrations();
  });
  afterAll(async () => {
    await ds?.destroy();
  });

  const indexDef = async (name: string): Promise<{ def: string; valid: boolean } | undefined> =>
    ((await ds.query(`SELECT pg_get_indexdef(i.indexrelid) AS def, i.indisvalid AS valid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE c.relname = $1`, [name])) as { def: string; valid: boolean }[])[0];

  it('index ghép idx_orders_user_created (user_id, created_at) tồn tại và HỢP LỆ; index đơn idx_orders_user đã bị thay', async () => {
    const created = await indexDef('idx_orders_user_created');
    expect(created?.valid).toBe(true);
    expect(created?.def).toMatch(/\(user_id, created_at\)/);
    expect(await indexDef('idx_orders_user')).toBeUndefined();
  });

  it('truy vấn "đơn của một người dùng, mới nhất trước" dùng index mới (không Seq Scan) trên bảng có dữ liệu', async () => {
    await ds.query(`INSERT INTO users (email, display_name) SELECT 'u' || g || '@x.com', 'U' || g FROM generate_series(1, 200) g`);
    await ds.query(
      `INSERT INTO orders (user_id, status, total_amount, created_at) SELECT 1 + (g % 200), 'paid', 1000, TIMESTAMPTZ '2026-01-01' + g * interval '1 minute' FROM generate_series(1, 30000) g`,
    );
    await ds.query('ANALYZE orders');
    const plan = (await ds.query(`EXPLAIN (FORMAT JSON) SELECT id FROM orders WHERE user_id = 7 ORDER BY created_at DESC LIMIT 10`)) as { 'QUERY PLAN': unknown[] }[];
    expect(JSON.stringify(plan[0]['QUERY PLAN'])).toMatch(/idx_orders_user_created/);
  });

  it('khóa ngoại orders.user_id vẫn có index với cột đầu là user_id (index ghép thay được index đơn)', async () => {
    const r = await one<{ n: number }>(
      ds,
      `SELECT count(*)::int AS n FROM pg_index i WHERE i.indrelid = 'orders'::regclass AND i.indisvalid AND i.indkey[0] = (SELECT attnum FROM pg_attribute WHERE attrelid = 'orders'::regclass AND attname = 'user_id')`,
    );
    expect(r.n).toBeGreaterThanOrEqual(1);
  });

  it('migration dùng CREATE INDEX CONCURRENTLY và khai báo transaction = false (Postgres cấm CONCURRENTLY trong transaction)', () => {
    const dir = repoPath('src', 'database', 'migrations');
    const files = readdirSync(dir).filter((f) => /\.(ts|js)$/.test(f));
    // Chỉ nhìn vào thân up(): down() có CONCURRENTLY mà up() thì không là lỗi (đột biến "index không CONCURRENTLY" từng lọt qua check cũ).
    const upBody = (src: string): string => /\bup\s*\([^)]*\)[^{]*\{([\s\S]*?)\n\s*\}\s*\n\s*(?:public\s+)?(?:async\s+)?down\b/.exec(src)?.[1] ?? '';
    const migrations = files.map((f) => ({ f, src: readFileSync(join(dir, f), 'utf8') })).filter((x) => /idx_orders_user_created/.test(upBody(x.src)));
    expect(migrations.length).toBeGreaterThanOrEqual(1);
    for (const { f, src } of migrations) {
      expect({ f, concurrentlyInUp: /CREATE\s+INDEX\s+CONCURRENTLY/i.test(upBody(src)) }).toEqual({ f, concurrentlyInUp: true });
      expect({ f, hasNoTx: /transaction\s*=\s*false/.test(src) }).toEqual({ f, hasNoTx: true });
    }
  });

  it('lùi rồi chạy lại: index cũ trở lại khi lùi, index mới trở lại khi chạy; cả hai lần đều hợp lệ', async () => {
    await revertDownTo(ds, 2); // bỏ migration index (và rename nếu có sau đó)
    expect((await indexDef('idx_orders_user'))?.valid).toBe(true);
    expect(await indexDef('idx_orders_user_created')).toBeUndefined();
    await ds.runMigrations();
    expect((await indexDef('idx_orders_user_created'))?.valid).toBe(true);
    expect(await indexDef('idx_orders_user')).toBeUndefined();
  });

  it('cấu hình cho phép migration không nằm trong transaction (migrationsTransactionMode = each hoặc none)', () => {
    expect(['each', 'none']).toContain((ds.options as { migrationsTransactionMode?: string }).migrationsTransactionMode);
  });
});
