import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { authConfig } from '../../src/config/auth.config';
import { bootWith } from './_cfg';
import { createTestApp, http, readSource, repoPath } from './_kit';

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? files(p) : p.endsWith('.ts') && !p.endsWith('.spec.ts') ? [p] : [];
  });
}

describe('C09 ex05 · dùng config đã kiểm tra thay vì process.env', () => {
  it('process.env chỉ xuất hiện trong src/config/ (và app.module.ts để chọn file .env theo NODE_ENV)', () => {
    const offenders = files(repoPath('src'))
      .map((f) => relative(repoPath('src'), f).replace(/\\/g, '/'))
      .filter((f) => !f.startsWith('config/') && f !== 'app.module.ts')
      .filter((f) => /process\.env/.test(readFileSync(repoPath('src', f), 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('main.ts lấy cổng từ config, không từ process.env', () => {
    const main = readSource('src', 'main.ts');
    expect(main).not.toMatch(/process\.env/);
    expect(main).toMatch(/ConfigService|appConfig/);
  });

  it('ApiKeyGuard dùng authConfig: override provider đổi khóa chấp nhận được', async () => {
    const app = await createTestApp({
      customize: (b) => b.overrideProvider(authConfig.KEY).useValue({ adminApiKey: 'khoa-tu-override-1', accessSecret: 'a'.repeat(32), refreshSecret: 'b'.repeat(32) }),
    });
    try {
      const body = { sku: 'CF-1', name: 'x', price: 1 };
      await http(app).post('/v1/products').set('x-api-key', 'dev-admin-key').send(body).expect(401);
      await http(app).post('/v1/products').set('x-api-key', 'khoa-tu-override-1').send(body).expect(201);
    } finally {
      await app.close();
    }
  });

  it('hành vi C07 giữ nguyên với khóa lấy từ biến ADMIN_API_KEY', async () => {
    const app = await bootWith({ ADMIN_API_KEY: 'khoa-tu-bien-moi-truong' });
    try {
      const body = { sku: 'CF-2', name: 'x', price: 1 };
      await http(app).post('/v1/products').send(body).expect(401);
      await http(app).post('/v1/products').set('x-api-key', 'dev-admin-key').send(body).expect(401);
      await http(app).post('/v1/products').set('x-api-key', 'khoa-tu-bien-moi-truong').send(body).expect(201);
      await http(app).get('/v1/products').expect(200);
    } finally {
      await app.close();
    }
  });
});
