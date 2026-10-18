import { readFileSync } from 'node:fs';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp, fileExists, readSource, repoPath } from './_kit';
import { DB_URL, dataSourceOf, freshDatabase, userTables, withEnv } from './_db';
import { stripComments } from './_src';
import { appliedMigrations, npmRun, openProjectDataSource } from './_b03';

jest.setTimeout(180_000);

describe('B03 ex01 · Hạ tầng migration: DataSource riêng, script npm, synchronize tắt', () => {
  it('src/database/data-source.ts export mặc định một DataSource: postgres, synchronize = false, có thư mục migrations', async () => {
    expect(fileExists('src', 'database', 'data-source.ts')).toBe(true);
    const ds = await openProjectDataSource();
    try {
      expect(ds).toBeInstanceOf(DataSource);
      expect(ds.options.type).toBe('postgres');
      expect(ds.options.synchronize).toBe(false);
      expect(ds.migrations.length).toBeGreaterThanOrEqual(1);
    } finally {
      await ds.destroy();
    }
  });

  it('package.json có script migration:generate, migration:run, migration:revert và seed', () => {
    const scripts = (JSON.parse(readFileSync(repoPath('package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts;
    for (const name of ['migration:generate', 'migration:run', 'migration:revert', 'seed']) expect({ name, defined: Boolean(scripts[name]) }).toEqual({ name, defined: true });
    expect(scripts['migration:run']).toMatch(/data-source/);
  });

  it('DB trống: `npm run migration:run` tạo schema, ghi sổ vào bảng migrations; chạy lần hai báo không còn gì để chạy', async () => {
    await freshDatabase();
    const first = npmRun('migration:run');
    expect({ status: first.status, tail: first.out.slice(-300) }).toMatchObject({ status: 0 });
    const ds = await openProjectDataSource();
    try {
      const applied = await appliedMigrations(ds);
      expect(applied.length).toBe(ds.migrations.length);
      expect(await userTables(ds)).toEqual(expect.arrayContaining(['products', 'categories', 'orders', 'order_items', 'payments', 'users', 'tags', 'product_tags', 'user_profiles']));
    } finally {
      await ds.destroy();
    }
    const second = npmRun('migration:run');
    expect(second.status).toBe(0);
    expect(second.out).toMatch(/no migrations are pending/i);
  });

  it('ứng dụng ngoài production tự áp dụng migration còn thiếu khi khởi động (DB trống → có bảng), và KHÔNG dùng synchronize', async () => {
    await freshDatabase();
    const app: INestApplication = await createTestApp();
    try {
      const ds = dataSourceOf(app);
      expect(ds.options.synchronize).toBe(false);
      expect(ds.options.migrationsRun).toBe(true);
      expect((await appliedMigrations(ds)).length).toBeGreaterThanOrEqual(1);
      expect(await userTables(ds)).toContain('products');
    } finally {
      await app.close();
    }
  });

  it('production: ứng dụng KHÔNG tự chạy migration (nhiều bản khởi động cùng lúc sẽ đua nhau); migration là một bước riêng của deploy', async () => {
    await freshDatabase();
    const production = {
      NODE_ENV: 'production',
      DATABASE_URL: DB_URL(),
      ADMIN_API_KEY: 'production-admin-key-0123456789',
      JWT_ACCESS_SECRET: 'production-access-secret-0123456789-abcdef',
      JWT_REFRESH_SECRET: 'production-refresh-secret-9876543210-fedcba',
      DEBUG_ENDPOINTS: 'false',
    };
    await withEnv(production, async () => {
      const app = await createTestApp();
      try {
        const ds = dataSourceOf(app);
        expect(ds.options.migrationsRun).toBe(false);
        expect(ds.options.synchronize).toBe(false);
        expect(await userTables(ds)).toEqual([]); // DB vẫn trống: không migration nào tự chạy
      } finally {
        await app.close();
      }
    });
  });

  it('quyết định synchronize/migrationsRun nằm ở databaseConfig, không rải điều kiện NODE_ENV trong database.module.ts', () => {
    expect(stripComments(readSource('src', 'config', 'database.config.ts'))).toMatch(/migrationsRun/);
    expect(stripComments(readSource('src', 'database', 'database.module.ts'))).not.toMatch(/NODE_ENV/);
  });
});
