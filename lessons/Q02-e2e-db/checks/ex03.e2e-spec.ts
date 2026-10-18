import { readFileSync } from 'node:fs';
import { fileExists, repoPath } from './_kit';
import { runE2e, failed } from './_e2e_run';

const SPEC = 'test/products.e2e-spec.ts';
jest.setTimeout(300_000);

describe('Q02 ex03 · bộ e2e Products chạy trên DB thật', () => {
  const src = () => readFileSync(repoPath(SPEC), 'utf8');

  it('có test/products.e2e-spec.ts', () => {
    expect(fileExists('test', 'products.e2e-spec.ts')).toBe(true);
  });

  it('bộ test xanh và có ít nhất 14 test', async () => {
    const r = await runE2e(SPEC);
    expect({ ok: r.ok, failed: failed(r), out: r.ok ? '' : r.output }).toEqual({ ok: true, failed: [], out: '' });
    expect(r.tests.length).toBeGreaterThanOrEqual(14);
  });

  it('phủ đủ phương thức và mã trạng thái: GET/POST/PATCH/DELETE; 200, 201, 204, 400, 401, 404, 409', () => {
    const s = src();
    for (const m of ['get', 'post', 'patch', 'delete']) expect({ m, used: new RegExp(`\\.${m}\\(`).test(s) }).toEqual({ m, used: true });
    for (const c of [200, 201, 204, 400, 401, 404, 409]) expect({ c, used: new RegExp(`\\b${c}\\b`).test(s) }).toEqual({ c, used: true });
  });

  it('mỗi test bắt đầu từ DB sạch: dùng cleanDatabase (từ test/support/clean-db) trong beforeEach', () => {
    const s = src();
    expect(s).toMatch(/clean-db/);
    expect(s).toMatch(/beforeEach\s*\([\s\S]*?cleanDatabase/);
  });

  it('dữ liệu dựng bằng factory (createProduct/makeProduct), không nhồi thân JSON giống nhau khắp nơi', () => {
    expect(src()).toMatch(/from ['"]\.\/factories['"]/);
    expect(src()).toMatch(/createProduct|makeProduct/);
  });

  it('có kiểm tra side effect TRONG DB (không chỉ nhìn phản hồi HTTP): DataSource / .query( / getRepository', () => {
    expect(src()).toMatch(/DataSource|\.query\(|getRepository|createQueryBuilder/);
  });

  it('không có id cố định trong URL (`/v1/products/1`) và không chờ bằng sleep/setTimeout', () => {
    const s = src();
    expect(s).not.toMatch(/\/v1\/products\/\d+/);
    expect(s).not.toMatch(/setTimeout|\bsleep\s*\(/);
  });

  it('chứng minh được lỗi (assertion thật): mỗi test có ít nhất một expect', async () => {
    const r = await runE2e(SPEC, { args: ['--testNamePattern=.'] });
    expect(r.ok).toBe(true);
    const s = src();
    expect((s.match(/\bexpect\(|\.expect\(/g) ?? []).length).toBeGreaterThanOrEqual(r.tests.length);
  });
});
