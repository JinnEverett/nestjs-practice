import { INestApplication } from '@nestjs/common';
import { NestContainer } from '@nestjs/core';
import { lazyCounters } from '../../src/reports/reports.service';
import { createTestApp, http, readSource } from './_kit';
import { createProduct } from './_fixtures';

describe('C10 ex06 · nạp module lười (LazyModuleLoader)', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });
  const names = () => [...((app as unknown as { container: NestContainer }).container.getModules().values())].map((m) => m.metatype?.name);

  it('lúc khởi động ReportsModule chưa được nạp và ReportsService chưa được dựng', () => {
    expect(names()).not.toContain('ReportsModule');
    expect(lazyCounters.constructed).toBe(0);
  });

  it('lần gọi đầu nạp module; các lần sau dùng lại (constructor đúng 1 lần)', async () => {
    await createProduct(app);
    await createProduct(app);
    const first = await http(app).get('/v1/_reports/summary').expect(200);
    expect(first.body).toEqual({ productCount: 2 });
    await createProduct(app);
    const second = await http(app).get('/v1/_reports/summary').expect(200);
    expect(second.body).toEqual({ productCount: 3 });
    await http(app).get('/v1/_reports/summary').expect(200);
    expect(lazyCounters.constructed).toBe(1);
    expect(names()).toContain('ReportsModule');
  });

  it('gọi song song lần đầu cũng chỉ dựng một lần', async () => {
    const app2 = await createTestApp();
    try {
      const before = lazyCounters.constructed;
      await Promise.all(Array.from({ length: 8 }, () => http(app2).get('/v1/_reports/summary').expect(200)));
      expect(lazyCounters.constructed - before).toBe(1);
    } finally {
      await app2.close();
    }
  });

  it('ReportsModule không được import tĩnh ở AppModule', () => {
    expect(readSource('src', 'app.module.ts')).not.toMatch(/ReportsModule/);
  });
});
