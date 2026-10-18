import { readFileSync } from 'node:fs';
import { INestApplication } from '@nestjs/common';
import { createTestApp, fileExists, http, readSource, repoPath } from './_kit';
import { validateEnv } from '../../src/config/env';
import { stripComments } from './_src';
import { DB_URL, dataSourceOf, resetDatabase, withEnv } from './_db';

describe('B01 ex01 · Nối Postgres bằng TypeOrmModule.forRootAsync', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app?.close();
  });

  it('có src/database/database.module.ts export DatabaseModule và AppModule import nó', () => {
    expect(fileExists('src', 'database', 'database.module.ts')).toBe(true);
    expect(readSource('src', 'database', 'database.module.ts')).toMatch(/export class DatabaseModule/);
    expect(readSource('src', 'app.module.ts')).toMatch(/DatabaseModule/);
  });

  it('cấu hình đi qua @nestjs/config (forRootAsync + databaseConfig), không đọc process.env trực tiếp ở module này', () => {
    const src = stripComments(readSource('src', 'database', 'database.module.ts'));
    expect(src).toMatch(/TypeOrmModule\.forRootAsync\(/);
    expect(src).toMatch(/databaseConfig/);
    expect(src).not.toMatch(/process\.env/);
  });

  it('DataSource đã khởi tạo, loại postgres, nối đúng database trong DATABASE_URL', async () => {
    const ds = dataSourceOf(app);
    expect(ds.isInitialized).toBe(true);
    expect(ds.options.type).toBe('postgres');
    const expected = new URL(DB_URL()).pathname.slice(1);
    const [row] = (await ds.query('SELECT current_database() AS db')) as { db: string }[];
    expect(row.db).toBe(expected);
  });

  it('ứng dụng tự tạo schema ở môi trường test và GET /v1/products trả 200 với danh sách rỗng trên DB trống', async () => {
    await resetDatabase(app);
    const res = await http(app).get('/v1/products').expect(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.total).toBe(0);
  });

  it('DB_LOGGING là biến môi trường kiểu boolean: có trong .env.example, Env phân biệt "true"/"false", và bật được ghi SQL', async () => {
    expect(readFileSync(repoPath('.env.example'), 'utf8')).toMatch(/^DB_LOGGING=/m);
    expect(validateEnv({ NODE_ENV: 'test', DB_LOGGING: 'true' }).DB_LOGGING).toBe(true);
    expect(validateEnv({ NODE_ENV: 'test', DB_LOGGING: 'false' }).DB_LOGGING).toBe(false); // Boolean('false') === true là cái bẫy
    expect(validateEnv({ NODE_ENV: 'test' }).DB_LOGGING).toBe(false);
    await withEnv({ DB_LOGGING: 'true' }, async () => {
      const other = await createTestApp();
      try {
        expect(dataSourceOf(other).options.logging).toBe(true);
      } finally {
        await other.close();
      }
    });
    expect(dataSourceOf(app).options.logging).toBe(false);
  });

  it('sai địa chỉ DB: ứng dụng KHÔNG khởi động và báo lỗi trong 10 giây (mặc định của @nestjs/typeorm là treo ~30 giây)', async () => {
    const started = Date.now();
    await withEnv({ DATABASE_URL: 'postgres://postgres:postgres@127.0.0.1:1/none' }, async () => {
      await expect(createTestApp()).rejects.toBeTruthy();
    });
    expect(Date.now() - started).toBeLessThan(10_000);
  }, 40_000);
});
