import { readFileSync } from 'node:fs';
import { fileExists, repoPath } from './_kit';
import { createDb, dropDb, tempName, urlFor } from './_pg';
import { failed, runE2e } from './_e2e_run';

const SPEC = 'test/flaky-db.e2e-spec.ts';
jest.setTimeout(600_000);

describe('Q02 ex05 · 🔴 "E2E đỏ ở CI, xanh ở máy dev"', () => {
  const src = () => readFileSync(repoPath(SPEC), 'utf8');

  it('có test/flaky-db.e2e-spec.ts (sao chép từ starter/ rồi sửa)', () => {
    expect(fileExists('test', 'flaky-db.e2e-spec.ts')).toBe(true);
  });

  it('vẫn giữ >= 5 test và bộ test xanh', async () => {
    const r = await runE2e(SPEC);
    expect({ ok: r.ok, failed: failed(r) }).toEqual({ ok: true, failed: [] });
    expect(r.tests.length).toBeGreaterThanOrEqual(5);
  });

  it('không còn id cố định (`/v1/products/1`, `.toBe(1)` cho id), không sleep/setTimeout', () => {
    const s = src();
    expect(s).not.toMatch(/\/v1\/products\/\d+/);
    expect(s).not.toMatch(/setTimeout|\bsleep\s*\(/);
    expect(s).not.toMatch(/\.id\)\.toBe\(\s*\d+\s*\)/);
  });

  it('không dùng biến chia sẻ giữa các test để truyền dữ liệu (let created ở mức describe được gán trong một test và đọc ở test khác)', () => {
    const s = src();
    expect(s).not.toMatch(/let\s+created\b/);
    expect(s).toMatch(/beforeEach\s*\([\s\S]*?(cleanDatabase|clean-db|TRUNCATE)/i);
  });

  it.each([3, 77, 90210])('xanh khi thứ tự test bị xáo trộn (seed %i)', async (seed) => {
    const r = await runE2e(SPEC, { args: ['--randomize', `--seed=${seed}`] });
    expect({ ok: r.ok, failed: failed(r) }).toEqual({ ok: true, failed: [] });
  });

  it('xanh khi chỉ chạy từng test riêng lẻ (-t) — không test nào cần test khác chạy trước', async () => {
    for (const name of ['đọc lại', 'danh sách', 'xóa']) {
      const r = await runE2e(SPEC, { args: ['-t', name] });
      expect({ name, ok: r.ok, failed: failed(r) }).toEqual({ name, ok: true, failed: [] });
    }
  });

  it('xanh khi chạy lần thứ hai trên DB đã có dữ liệu từ lần trước, và khi hai bản chạy song song trên hai DB', async () => {
    const a = tempName('fa');
    const b = tempName('fb');
    await createDb(a);
    await createDb(b);
    try {
      const first = await runE2e(SPEC, { env: { DATABASE_URL: urlFor(a) } });
      const [again, other] = await Promise.all([
        runE2e(SPEC, { env: { DATABASE_URL: urlFor(a) } }),
        runE2e(SPEC, { env: { DATABASE_URL: urlFor(b) } }),
      ]);
      expect({ first: first.ok, again: again.ok, other: other.ok }).toEqual({ first: true, again: true, other: true });
    } finally {
      await dropDb(a);
      await dropDb(b);
    }
  });
});
