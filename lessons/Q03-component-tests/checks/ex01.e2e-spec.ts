import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { PARSE_ID_MUTANTS, PARSE_SKU_MUTANTS } from './_mutants';

jest.setTimeout(600_000);

describe('Q03 ex01 · pipe tự viết', () => {
  describe('src/common/pipes/parse-id.pipe.spec.ts', () => {
    const SPEC = 'src/common/pipes/parse-id.pipe.spec.ts';
    it(`có ${SPEC}`, () => {
      expect(fileExists(...SPEC.split('/'))).toBe(true);
    });
    it('spec xanh trên code của bạn và phủ >= 90% nhánh', async () => {
      const r = await runSpec(SPEC, { coverageFor: ['src/common/pipes/parse-id.pipe.ts'] });
      expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
      expect(r.branchPct).toBeGreaterThanOrEqual(90);
    });
    it('spec bắt được >= 80% lỗi cài sẵn', async () => {
      const { survived, killed } = await survivors(SPEC, 'src/common/pipes/parse-id.pipe.ts', '_ref_parse_id.ts', PARSE_ID_MUTANTS);
      const need = Math.ceil(PARSE_ID_MUTANTS.length * 0.8);
      if (killed < need) throw new Error(`Chỉ bắt ${killed}/${PARSE_ID_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
    });
  });

  describe('src/common/pipes/parse-sku.pipe.spec.ts', () => {
    const SPEC = 'src/common/pipes/parse-sku.pipe.spec.ts';
    it(`có ${SPEC}`, () => {
      expect(fileExists(...SPEC.split('/'))).toBe(true);
    });
    it('spec xanh trên code của bạn và phủ >= 90% nhánh', async () => {
      const r = await runSpec(SPEC, { coverageFor: ['src/common/pipes/parse-sku.pipe.ts'] });
      expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
      expect(r.branchPct).toBeGreaterThanOrEqual(90);
    });
    it('spec bắt được >= 80% lỗi cài sẵn', async () => {
      const { survived, killed } = await survivors(SPEC, 'src/common/pipes/parse-sku.pipe.ts', '_ref_parse_sku.ts', PARSE_SKU_MUTANTS);
      const need = Math.ceil(PARSE_SKU_MUTANTS.length * 0.8);
      if (killed < need) throw new Error(`Chỉ bắt ${killed}/${PARSE_SKU_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
    });
  });

});
