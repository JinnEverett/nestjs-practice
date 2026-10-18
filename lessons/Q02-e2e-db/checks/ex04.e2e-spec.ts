import { createDb, dropDb, tempName, urlFor } from './_pg';
import { failed, runE2e } from './_e2e_run';

const SPEC = 'test/products.e2e-spec.ts';
jest.setTimeout(600_000);

describe('Q02 ex04 · ổn định: 3 lần liên tiếp, thứ tự ngẫu nhiên, và song song trên hai DB', () => {
  it.each([1, 2, 3])('lần chạy liên tiếp %i trên cùng một DB, KHÔNG dọn tay giữa các lần → xanh', async () => {
    const r = await runE2e(SPEC);
    expect({ ok: r.ok, failed: failed(r) }).toEqual({ ok: true, failed: [] });
  });

  it.each([7, 8080, 424242])('thứ tự ngẫu nhiên (seed %i) → xanh (test không phụ thuộc nhau)', async (seed) => {
    const r = await runE2e(SPEC, { args: ['--randomize', `--seed=${seed}`] });
    expect({ ok: r.ok, failed: failed(r) }).toEqual({ ok: true, failed: [] });
  });

  it('hai tiến trình chạy ĐỒNG THỜI, mỗi tiến trình một database riêng (qua DATABASE_URL) → cả hai xanh', async () => {
    const a = tempName('a');
    const b = tempName('b');
    await createDb(a);
    await createDb(b);
    try {
      const [ra, rb] = await Promise.all([
        runE2e(SPEC, { env: { DATABASE_URL: urlFor(a) } }),
        runE2e(SPEC, { env: { DATABASE_URL: urlFor(b) } }),
      ]);
      expect({ a: ra.ok, b: rb.ok, fa: failed(ra), fb: failed(rb) }).toEqual({ a: true, b: true, fa: [], fb: [] });
    } finally {
      await dropDb(a);
      await dropDb(b);
    }
  });

  it('DB mới tinh (schema chưa có) vẫn chạy được: ứng dụng tự tạo schema ở môi trường test', async () => {
    const n = tempName('fresh');
    await createDb(n);
    try {
      const r = await runE2e(SPEC, { env: { DATABASE_URL: urlFor(n) } });
      expect({ ok: r.ok, failed: failed(r) }).toEqual({ ok: true, failed: [] });
    } finally {
      await dropDb(n);
    }
  });
});
