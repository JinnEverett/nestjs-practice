import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { TIMEOUT_MUTANTS } from './_mutants';

jest.setTimeout(600_000);

describe('Q03 ex03 · interceptor timeout với fake timers', () => {
  describe('src/common/interceptors/timeout.interceptor.spec.ts', () => {
    const SPEC = 'src/common/interceptors/timeout.interceptor.spec.ts';
    it(`có ${SPEC}`, () => {
      expect(fileExists(...SPEC.split('/'))).toBe(true);
    });
    it('spec xanh trên code của bạn và phủ >= 80% nhánh', async () => {
      const r = await runSpec(SPEC, { coverageFor: ['src/common/interceptors/timeout.interceptor.ts'] });
      expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
      expect(r.branchPct).toBeGreaterThanOrEqual(80);
    });
    it('spec bắt được >= 80% lỗi cài sẵn', async () => {
      const { survived, killed } = await survivors(SPEC, 'src/common/interceptors/timeout.interceptor.ts', '_ref_timeout.ts', TIMEOUT_MUTANTS);
      const need = Math.ceil(TIMEOUT_MUTANTS.length * 0.8);
      if (killed < need) throw new Error(`Chỉ bắt ${killed}/${TIMEOUT_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
    });
  });

});
