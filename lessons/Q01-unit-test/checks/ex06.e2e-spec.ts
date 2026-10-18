import { runSpec } from './_mutation';

jest.setTimeout(600_000);

const SPECS = [
  'src/pricing/pricing.service.spec.ts',
  'src/products/products.service.spec.ts',
  'src/orders/orders.service.spec.ts',
  'src/orders/orders.controller.spec.ts',
];

describe('Q01 ex06 · 🔴 test xanh chập chờn và test không kiểm gì', () => {
  it('mỗi test có ít nhất một assertion (expect.hasAssertions)', async () => {
    const r = await runSpec(SPECS, { assertionsRequired: true });
    expect({ ok: r.ok, failed: r.tests.filter((t) => t.status !== 'passed').map((t) => t.name) }).toEqual({ ok: true, failed: [] });
  });

  it.each([1, 2, 3])('thứ tự chạy ngẫu nhiên lần %i vẫn xanh (không phụ thuộc thứ tự/trạng thái dùng chung)', async (n) => {
    const r = await runSpec(SPECS, { extraArgs: ['--randomize', `--seed=${1000 * n + 7}`] });
    expect({ ok: r.ok, failed: r.tests.filter((t) => t.status !== 'passed').map((t) => t.name) }).toEqual({ ok: true, failed: [] });
  });

  it('không dùng giờ thật hay sleep trong spec (test nhanh và xác định)', async () => {
    const { readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    for (const spec of SPECS) {
      const text = readFileSync(join(__dirname, '..', '..', spec), 'utf8');
      expect({ spec, bad: /setTimeout\s*\(|\bsleep\s*\(|Math\.random\s*\(/.test(text) }).toEqual({ spec, bad: false });
    }
  });
});
