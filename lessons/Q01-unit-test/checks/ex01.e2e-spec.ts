import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { PRICING_MUTANTS } from './_mutants';

const SPEC = 'src/pricing/pricing.service.spec.ts';
jest.setTimeout(600_000);

describe('Q01 ex01 · unit test PricingService', () => {
  it(`có ${SPEC}`, () => {
    expect(fileExists('src', 'pricing', 'pricing.service.spec.ts')).toBe(true);
  });

  it('spec xanh trên code của bạn và phủ >= 90% nhánh của pricing.service.ts', async () => {
    const r = await runSpec(SPEC, { coverageFor: ['src/pricing/pricing.service.ts'] });
    expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
    expect(r.branchPct).toBeGreaterThanOrEqual(90);
  });

  it('spec bắt được >= 80% lỗi cài sẵn (mutant): những hành vi nào chưa có test?', async () => {
    const { survived, killed } = await survivors(SPEC, 'src/pricing/pricing.service.ts', '_ref_pricing.ts', PRICING_MUTANTS);
    const need = Math.ceil(PRICING_MUTANTS.length * 0.8);
    expect({ killed, need, chuaBatDuoc: survived }).toEqual({ killed: expect.any(Number), need, chuaBatDuoc: expect.anything() });
    if (killed < need) throw new Error(`Chỉ bắt ${killed}/${PRICING_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
  });
});
