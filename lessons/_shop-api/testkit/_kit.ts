// Testkit dùng chung cho check e2e (Tier C trở đi). check.sh copy file này vào shop-api/test/_checks/.
// Chỉ dựa vào "bề mặt ổn định" trong lessons/_shop-api/CONTRACT.md: AppModule và (nếu có) configureApp.
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

export interface TestAppOptions {
  /** Cho phép check ghi đè provider: (b) => b.overrideProvider(X).useValue(fake) */
  customize?: (builder: TestingModuleBuilder) => TestingModuleBuilder;
  /** Bỏ qua configureApp (hiếm) */
  skipSetup?: boolean;
}

function loadSetup(): ((app: INestApplication) => void | Promise<void>) | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('../../src/app.setup').configureApp;
  } catch {
    return undefined; // C01 ex01 chưa có app.setup
  }
}

export async function createTestApp(options: TestAppOptions = {}): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.customize) builder = options.customize(builder);
  const moduleRef: TestingModule = await builder.compile();
  const app = moduleRef.createNestApplication();
  const setup = options.skipSetup ? undefined : loadSetup();
  if (setup) await setup(app);
  await app.init();
  return app;
}

/** supertest agent gắn vào app: http(app).get('/ping') */
export const http = (app: INestApplication) => request(app.getHttpServer());

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Kiểm tra file/thư mục tồn tại trong shop-api (dùng cho bài cấu trúc). */
export function repoPath(...parts: string[]): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require('node:path') as typeof import('node:path');
  return path.join(__dirname, '..', '..', ...parts);
}
export function fileExists(...parts: string[]): boolean {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('node:fs') as typeof import('node:fs')).existsSync(repoPath(...parts));
}
export function readSource(...parts: string[]): string {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return (require('node:fs') as typeof import('node:fs')).readFileSync(repoPath(...parts), 'utf8');
}
