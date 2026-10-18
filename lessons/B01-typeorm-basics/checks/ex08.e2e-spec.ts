import { DataSource } from 'typeorm';
import { createTestApp, http, readSource } from './_kit';
import { stripComments } from './_src';
import { DB_URL, dataSourceOf, withEnv } from './_db';

const hasColumn = async (ds: DataSource, col: string): Promise<boolean> =>
  ((await ds.query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = $1`, [col])) as unknown[]).length > 0;

describe('B01 ex08 · 🔴 "Deploy xong thì mất một cột" (synchronize ở production)', () => {
  const production = {
    NODE_ENV: 'production',
    DATABASE_URL: DB_URL(),
    ADMIN_API_KEY: 'production-admin-key-0123456789',
    JWT_ACCESS_SECRET: 'production-access-secret-0123456789-abcdef',
    JWT_REFRESH_SECRET: 'production-refresh-secret-9876543210-fedcba',
    DEBUG_ENDPOINTS: 'false',
  };

  it('ngoài production, synchronize bật và TỰ XÓA cột lạ mà entity không có (đây là lý do nó nguy hiểm)', async () => {
    const app = await createTestApp();
    const ds = dataSourceOf(app);
    expect(ds.options.synchronize).toBe(true);
    await ds.query(`ALTER TABLE products ADD COLUMN junk_dev integer`);
    await app.close();

    const again = await createTestApp(); // khởi động lại: synchronize đồng bộ lại schema
    try {
      expect(await hasColumn(dataSourceOf(again), 'junk_dev')).toBe(false);
    } finally {
      await again.close();
    }
  });

  it('production: synchronize = false và cột lạ do DBA thêm vào KHÔNG bị đụng tới khi ứng dụng khởi động', async () => {
    const setup = await createTestApp(); // bảo đảm schema đã có
    await dataSourceOf(setup).query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS junk_prod integer`);
    await setup.close();

    await withEnv(production, async () => {
      const app = await createTestApp();
      try {
        const ds = dataSourceOf(app);
        expect(ds.options.synchronize).toBe(false);
        expect(await hasColumn(ds, 'junk_prod')).toBe(true);
        await http(app).get('/v1/products').expect(200); // vẫn phục vụ bình thường
      } finally {
        await app.close();
      }
    });

    const cleanup = await createTestApp(); // dọn (synchronize ngoài production xóa cột lạ)
    try {
      expect(await hasColumn(dataSourceOf(cleanup), 'junk_prod')).toBe(false);
    } finally {
      await cleanup.close();
    }
  });

  it('quyết định bật/tắt synchronize nằm ở cấu hình (databaseConfig), không rải điều kiện NODE_ENV trong module', () => {
    expect(readSource('src', 'config', 'database.config.ts')).toMatch(/synchronize/);
    expect(stripComments(readSource('src', 'database', 'database.module.ts'))).not.toMatch(/NODE_ENV/);
  });
});
