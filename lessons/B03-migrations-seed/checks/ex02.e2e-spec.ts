import { DataSource } from 'typeorm';
import { freshDatabase, userTables } from './_db';
import { appliedMigrations, npmRun, openProjectDataSource, revertDownTo } from './_b03';

jest.setTimeout(180_000);

describe('B03 ex02 · Lùi được (down) và schema sau migration khớp entity', () => {
  let ds: DataSource;
  beforeAll(async () => {
    await freshDatabase();
    ds = await openProjectDataSource();
  });
  afterAll(async () => {
    await ds?.destroy();
  });

  it('chạy toàn bộ migration lên DB trống, rồi lùi TỪNG bước tới hết: mỗi lần lùi giảm đúng 1, cuối cùng không còn bảng nào', async () => {
    await ds.runMigrations();
    const total = (await appliedMigrations(ds)).length;
    expect(total).toBe(ds.migrations.length);
    expect(total).toBeGreaterThanOrEqual(4);
    const reverted = await revertDownTo(ds, 0);
    expect(reverted).toHaveLength(total);
    expect(await appliedMigrations(ds)).toEqual([]);
    expect(await userTables(ds)).toEqual([]); // không còn bảng nghiệp vụ nào (userTables bỏ qua bảng sổ `migrations`)
  });

  it('vòng khứ hồi lên → xuống → lên không lỗi và cho cùng một kết quả', async () => {
    await ds.runMigrations();
    const before = await appliedMigrations(ds);
    await revertDownTo(ds, 0);
    await ds.runMigrations();
    expect(await appliedMigrations(ds)).toEqual(before);
  });

  it('schema sau khi chạy hết migration KHỚP entity: không còn câu lệnh nào để đồng bộ (migration:generate sẽ sinh file rỗng)', async () => {
    const sqlInMemory = await ds.driver.createSchemaBuilder().log();
    expect(sqlInMemory.upQueries.map((q) => q.query)).toEqual([]);
  });

  it('`npm run migration:revert` lùi đúng một migration và `migration:run` áp dụng lại nó', async () => {
    const n = (await appliedMigrations(ds)).length;
    await ds.destroy();
    const rev = npmRun('migration:revert');
    expect(rev.status).toBe(0);
    ds = await openProjectDataSource();
    expect((await appliedMigrations(ds)).length).toBe(n - 1);
    await ds.destroy();
    const run = npmRun('migration:run');
    expect(run.status).toBe(0);
    ds = await openProjectDataSource();
    expect((await appliedMigrations(ds)).length).toBe(n);
  });

  it('tên migration theo quy ước TypeORM: <timestamp 13 chữ số>-<Tên>, class kết thúc bằng timestamp, timestamp tăng dần và không trùng', async () => {
    const names = ds.migrations.map((m) => m.name ?? m.constructor.name);
    const stamps = names.map((n) => Number(/(\d{13})$/.exec(n)?.[1]));
    expect(stamps.every((s) => Number.isFinite(s))).toBe(true);
    expect(new Set(stamps).size).toBe(stamps.length);
    expect([...stamps].sort((a, b) => a - b)).toEqual(stamps);
  });
});
