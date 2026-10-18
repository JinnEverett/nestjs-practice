import { INestApplication } from '@nestjs/common';

export const CONFIG_KEYS = [
  'NODE_ENV', 'PORT', 'DATABASE_URL', 'REDIS_URL', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
  'ADMIN_API_KEY', 'DEBUG_ENDPOINTS', 'SHIPPING_FEE', 'FREE_SHIPPING_THRESHOLD',
] as const;

export const PROD_OK: Record<string, string> = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://app:pw@db.internal:5432/shop',
  REDIS_URL: 'redis://cache.internal:6379',
  JWT_ACCESS_SECRET: 'A'.repeat(40),
  JWT_REFRESH_SECRET: 'B'.repeat(40),
  ADMIN_API_KEY: 'prod-admin-key-0123456789',
};

/**
 * Dựng ứng dụng với một bộ biến môi trường SẠCH (xóa mọi khóa cấu hình trước, đặt lại sau).
 * Dùng jest.resetModules() vì ConfigModule.forRoot() đọc env và kiểm tra ngay khi AppModule được import.
 * Lỗi cấu hình có thể ném ở bước require hoặc compile: cả hai đều là reject của hàm này.
 */
export async function bootWith(env: Record<string, string | undefined>): Promise<INestApplication> {
  const saved: Record<string, string | undefined> = {};
  for (const k of CONFIG_KEYS) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  const merged: Record<string, string | undefined> = { NODE_ENV: 'test', ...env };
  for (const [k, v] of Object.entries(merged)) if (v !== undefined) process.env[k] = v;
  try {
    jest.resetModules();
    /* eslint-disable @typescript-eslint/no-require-imports */
    const { Test } = require('@nestjs/testing');
    const { AppModule } = require('../../src/app.module');
    const { configureApp } = require('../../src/app.setup');
    const { ConfigService } = require('@nestjs/config');
    /* eslint-enable @typescript-eslint/no-require-imports */
    const ref = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app: INestApplication = ref.createNestApplication();
    await configureApp(app);
    await app.init();
    configServices.set(app, ConfigService);
    return app;
  } finally {
    for (const k of CONFIG_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

/** ConfigService của đúng bản @nestjs/config mà ứng dụng đã dùng (sau jest.resetModules lớp này khác lớp import tĩnh). */
const configServices = new WeakMap<object, new (...a: never[]) => unknown>();
export const configOf = (app: INestApplication): { get<T = unknown>(path: string): T } =>
  app.get(configServices.get(app) as never, { strict: false });

export const errorText = async (p: Promise<unknown>): Promise<string> => {
  try {
    const app = (await p) as INestApplication;
    await app.close();
    return '';
  } catch (e) {
    return e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }
};
