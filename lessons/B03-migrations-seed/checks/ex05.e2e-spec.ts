import { DataSource } from 'typeorm';
import { freshDatabase } from './_db';
import { one, openProjectDataSource, revertDownTo } from './_b03';

jest.setTimeout(180_000);

const hasColumn = async (ds: DataSource, table: string, col: string): Promise<boolean> =>
  ((await ds.query(`SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`, [table, col])) as unknown[]).length > 0;

describe('B03 ex05 · Đổi tên cột mà KHÔNG mất dữ liệu (users.full_name → display_name)', () => {
  let ds: DataSource;
  beforeAll(async () => {
    await freshDatabase();
    ds = await openProjectDataSource();
    await ds.runMigrations();
  });
  afterAll(async () => {
    await ds?.destroy();
  });

  it('sau khi chạy hết migration: users có cột display_name, không còn full_name', async () => {
    expect(await hasColumn(ds, 'users', 'display_name')).toBe(true);
    expect(await hasColumn(ds, 'users', 'full_name')).toBe(false);
  });

  it('entity: thuộc tính fullName vẫn dùng được và ánh xạ vào cột display_name (API không đổi)', () => {
    const meta = ds.entityMetadatas.find((m) => m.tableName === 'users')!;
    const col = meta.columns.find((c) => c.propertyName === 'fullName');
    expect(col?.databaseName).toBe('display_name');
  });

  it('giá trị CÓ SẴN được giữ nguyên qua cả hai chiều: lùi về schema cũ (full_name), chèn 500 người dùng, chạy lên (display_name), rồi lùi lại', async () => {
    const total = (await ds.query('SELECT count(*)::int AS n FROM migrations')) as { n: number }[];
    const renameIsLast = total[0].n;
    await revertDownTo(ds, renameIsLast - 1); // lùi đúng migration đổi tên (migration cuối cùng)
    expect(await hasColumn(ds, 'users', 'full_name')).toBe(true);
    await ds.query(`INSERT INTO users (email, full_name) SELECT 'rn' || g || '@x.com', 'Tên đầy đủ số ' || g FROM generate_series(1, 500) g`);
    const before = await one<{ h: string }>(ds, `SELECT md5(string_agg(full_name, ',' ORDER BY id)) AS h FROM users`);

    await ds.runMigrations();
    expect(await hasColumn(ds, 'users', 'display_name')).toBe(true);
    const upper = await one<{ h: string; n: number }>(ds, `SELECT md5(string_agg(display_name, ',' ORDER BY id)) AS h, count(*)::int AS n FROM users`);
    expect(upper).toEqual({ h: before.h, n: 500 });

    await revertDownTo(ds, renameIsLast - 1);
    const lower = await one<{ h: string }>(ds, `SELECT md5(string_agg(full_name, ',' ORDER BY id)) AS h FROM users`);
    expect(lower.h).toBe(before.h);
    await ds.runMigrations();
  });

  it('cùng một dòng, cùng id: đổi tên không tạo dòng mới hay đổi id (RENAME COLUMN, không phải DROP + ADD)', async () => {
    await ds.query(`INSERT INTO users (email, display_name) VALUES ('keep@x.com', 'Giữ nguyên')`);
    const row = await one<{ id: number }>(ds, `SELECT id FROM users WHERE email = 'keep@x.com'`);
    const total = ((await ds.query('SELECT count(*)::int AS n FROM migrations')) as { n: number }[])[0].n;
    await revertDownTo(ds, total - 1);
    const after = await one<{ id: number; full_name: string }>(ds, `SELECT id, full_name FROM users WHERE email = 'keep@x.com'`);
    expect(after).toEqual({ id: row.id, full_name: 'Giữ nguyên' });
    await ds.runMigrations();
  });
});
