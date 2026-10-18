import { existsSync, readFileSync } from 'node:fs';
import { INestApplication } from '@nestjs/common';
import { createTestApp } from './_kit';
import { getDoc } from './_doc';
import { repoPath } from './_kit';

describe('C11 ex08 · 🔴 contract được commit và không trôi', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('openapi.json nằm ở gốc shop-api (file được commit)', () => {
    expect(existsSync(repoPath('openapi.json'))).toBe(true);
  });

  it('nội dung openapi.json KHỚP với /docs-json hiện tại (đổi API mà quên xuất lại contract là lỗi)', async () => {
    const committed = JSON.parse(readFileSync(repoPath('openapi.json'), 'utf8'));
    const live = await getDoc(app);
    expect(committed).toEqual(live);
  });

  it('file có định dạng ổn định để diff trong code review: thụt lề 2 khoảng trắng, kết thúc bằng xuống dòng', () => {
    const text = readFileSync(repoPath('openapi.json'), 'utf8');
    expect(text.endsWith('\n')).toBe(true);
    expect(text).toMatch(/^\{\n  "openapi": /);
  });

  it('có script xuất contract (scripts/export-openapi.ts hoặc script npm "docs:export")', () => {
    const pkg = JSON.parse(readFileSync(repoPath('package.json'), 'utf8'));
    const hasNpm = typeof pkg.scripts?.['docs:export'] === 'string';
    expect(hasNpm || existsSync(repoPath('scripts', 'export-openapi.ts'))).toBe(true);
  });

  it('contract không chứa đường dẫn nội bộ hay bí mật (vd. dev-admin-key, _trace, localhost)', () => {
    const text = readFileSync(repoPath('openapi.json'), 'utf8');
    for (const leak of ['dev-admin-key', '_trace', '_scope', 'localhost', 'password']) expect({ leak, found: text.includes(leak) }).toEqual({ leak, found: false });
  });
});
