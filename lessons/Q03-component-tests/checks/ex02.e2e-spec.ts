import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { GUARD_MUTANTS } from './_mutants';

jest.setTimeout(600_000);

describe('Q03 ex02 · guard với ExecutionContext giả', () => {
  describe('src/common/guards/api-key.guard.spec.ts', () => {
    const SPEC = 'src/common/guards/api-key.guard.spec.ts';
    it(`có ${SPEC}`, () => {
      expect(fileExists(...SPEC.split('/'))).toBe(true);
    });
    it('spec xanh trên code của bạn và phủ >= 70% nhánh', async () => {
      const r = await runSpec(SPEC, { coverageFor: ['src/common/guards/api-key.guard.ts'] });
      expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
      expect(r.branchPct).toBeGreaterThanOrEqual(70);
    });
    it('spec bắt được >= 80% lỗi cài sẵn', async () => {
      const { survived, killed } = await survivors(SPEC, 'src/common/guards/api-key.guard.ts', '_ref_guard.ts', GUARD_MUTANTS);
      const need = Math.ceil(GUARD_MUTANTS.length * 0.8);
      if (killed < need) throw new Error(`Chỉ bắt ${killed}/${GUARD_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
    });
  });

});
