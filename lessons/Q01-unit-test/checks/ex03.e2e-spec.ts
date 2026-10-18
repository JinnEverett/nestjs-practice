import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { ORDERS_MUTANTS } from './_mutants';

const SPEC = 'src/orders/orders.service.spec.ts';
jest.setTimeout(600_000);

describe('Q01 ex03 · unit test OrdersService (mock collaborators)', () => {
  it(`có ${SPEC}`, () => {
    expect(fileExists(...SPEC.split('/'))).toBe(true);
  });

  it('spec xanh trên code của bạn và phủ >= 80% nhánh của file được test', async () => {
    const r = await runSpec(SPEC, { coverageFor: ['src/orders/orders.service.ts'] });
    expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
    expect(r.branchPct).toBeGreaterThanOrEqual(80);
  });

  it('spec bắt được >= 80% lỗi cài sẵn (mutant)', async () => {
    const { survived, killed } = await survivors(SPEC, 'src/orders/orders.service.ts', '_ref_orders.ts', ORDERS_MUTANTS);
    const need = Math.ceil(ORDERS_MUTANTS.length * 0.8);
    if (killed < need) throw new Error(`Chỉ bắt ${killed}/${ORDERS_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
  });
});
