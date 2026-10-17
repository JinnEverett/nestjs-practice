import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { ORDERS_CONTROLLER_MUTANTS } from './_mutants';

const SPEC = 'src/orders/orders.controller.spec.ts';
jest.setTimeout(600_000);

describe('Q01 ex04 · unit test OrdersController', () => {
  it(`có ${SPEC}`, () => {
    expect(fileExists(...SPEC.split('/'))).toBe(true);
  });

  it('spec xanh trên code của bạn và chạy qua mọi method của controller', async () => {
    const r = await runSpec(SPEC, { coverageFor: ['src/orders/orders.controller.ts'] });
    expect({ ok: r.ok, out: r.ok ? '' : r.output }).toEqual({ ok: true, out: '' });
    expect(r.branchPct).toBeDefined();
  });

  it('spec bắt được >= 80% lỗi cài sẵn (mutant)', async () => {
    const { survived, killed } = await survivors(SPEC, 'src/orders/orders.controller.ts', '_ref_orders_controller.ts', ORDERS_CONTROLLER_MUTANTS);
    const need = Math.ceil(ORDERS_CONTROLLER_MUTANTS.length * 0.8);
    if (killed < need) throw new Error(`Chỉ bắt ${killed}/${ORDERS_CONTROLLER_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
  });
});
