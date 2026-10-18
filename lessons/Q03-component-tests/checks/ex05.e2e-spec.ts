import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { FILTER_MUTANTS } from './_mutants';

jest.setTimeout(600_000);

describe('Q03 ex05 · exception filter với HttpAdapterHost giả', () => {
  describe('src/common/filters/all-exceptions.filter.spec.ts', () => {
    const SPEC = 'src/common/filters/all-exceptions.filter.spec.ts';
    it(`có ${SPEC}`, () => {
      expect(fileExists(...SPEC.split('/'))).toBe(true);
    });
    it('spec xanh trên code của bạn và phủ >= 80% nhánh', async () => {
      const r = await runSpec(SPEC, { coverageFor: ['src/common/filters/all-exceptions.filter.ts'] });
      expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
      expect(r.branchPct).toBeGreaterThanOrEqual(80);
    });
    it('spec bắt được >= 80% lỗi cài sẵn', async () => {
      const { survived, killed } = await survivors(SPEC, 'src/common/filters/all-exceptions.filter.ts', '_ref_filter.ts', FILTER_MUTANTS);
      const need = Math.ceil(FILTER_MUTANTS.length * 0.8);
      if (killed < need) throw new Error(`Chỉ bắt ${killed}/${FILTER_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
    });
  });

});
