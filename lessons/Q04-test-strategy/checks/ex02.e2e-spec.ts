import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { DISCOUNT_MUTANTS } from './_mutants';

const SPEC = 'src/demo/discount.spec.ts';
jest.setTimeout(600_000);

describe('Q04 ex02 · coverage cao không có nghĩa là test tốt', () => {
  it('có src/demo/discount.ts và discount.spec.ts (sao chép từ starter/)', () => {
    expect(fileExists('src', 'demo', 'discount.ts')).toBe(true);
    expect(fileExists('src', 'demo', 'discount.spec.ts')).toBe(true);
  });

  it('spec không còn là `expect(true).toBe(true)` giả và mỗi test đều có assertion thật', async () => {
    const text = readFileSync(join(__dirname, '..', '..', SPEC), 'utf8');
    expect(text).not.toMatch(/expect\(\s*true\s*\)\.toBe\(\s*true\s*\)/);
    const r = await runSpec(SPEC, { assertionsRequired: true });
    expect({ ok: r.ok, failed: r.tests.filter((t) => t.status !== 'passed').map((t) => t.name) }).toEqual({ ok: true, failed: [] });
  });

  it('coverage nhánh vẫn >= 90%', async () => {
    const r = await runSpec(SPEC, { coverageFor: ['src/demo/discount.ts'] });
    expect(r.ok).toBe(true);
    expect(r.branchPct).toBeGreaterThanOrEqual(90);
  });

  it('spec bắt được >= 80% lỗi cài sẵn (đây mới là thước đo của "test có nghĩa")', async () => {
    const { survived, killed } = await survivors(SPEC, 'src/demo/discount.ts', '_ref_discount.ts', DISCOUNT_MUTANTS);
    const need = Math.ceil(DISCOUNT_MUTANTS.length * 0.8);
    if (killed < need) throw new Error(`Chỉ bắt ${killed}/${DISCOUNT_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
  });
});
