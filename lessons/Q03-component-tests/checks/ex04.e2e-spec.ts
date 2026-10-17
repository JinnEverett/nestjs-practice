import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { CACHE_MUTANTS } from './_mutants';

jest.setTimeout(600_000);

describe('Q03 ex04 · interceptor cache với đồng hồ giả', () => {
  describe('src/common/interceptors/get-cache.interceptor.spec.ts', () => {
    const SPEC = 'src/common/interceptors/get-cache.interceptor.spec.ts';
    it(`có ${SPEC}`, () => {
      expect(fileExists(...SPEC.split('/'))).toBe(true);
    });
    it('spec xanh trên code của bạn và phủ >= 85% nhánh', async () => {
      const r = await runSpec(SPEC, { coverageFor: ['src/common/interceptors/get-cache.interceptor.ts'] });
      expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
      expect(r.branchPct).toBeGreaterThanOrEqual(85);
    });
    it('spec bắt được >= 80% lỗi cài sẵn', async () => {
      const { survived, killed } = await survivors(SPEC, 'src/common/interceptors/get-cache.interceptor.ts', '_ref_cache.ts', CACHE_MUTANTS);
      const need = Math.ceil(CACHE_MUTANTS.length * 0.8);
      if (killed < need) throw new Error(`Chỉ bắt ${killed}/${CACHE_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
    });
  });

});
