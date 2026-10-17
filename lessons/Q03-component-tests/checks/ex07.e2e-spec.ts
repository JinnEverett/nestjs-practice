import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runSpec } from './_mutation';

jest.setTimeout(600_000);

const SPECS = [
  'src/common/pipes/parse-id.pipe.spec.ts',
  'src/common/pipes/parse-sku.pipe.spec.ts',
  'src/common/guards/api-key.guard.spec.ts',
  'src/common/interceptors/timeout.interceptor.spec.ts',
  'src/common/interceptors/get-cache.interceptor.spec.ts',
  'src/common/filters/all-exceptions.filter.spec.ts',
  'src/common/middleware/request-id.middleware.spec.ts',
  'src/common/middleware/http-logger.middleware.spec.ts',
];

describe('Q03 ex07 · 🔴 "Bộ test mất 40 giây và đỏ ngẫu nhiên"', () => {
  it('toàn bộ 8 spec chạy dưới 25 giây (không sleep thật; thời gian dùng fake timers / đồng hồ giả)', async () => {
    const t0 = Date.now();
    const r = await runSpec(SPECS);
    const elapsed = Date.now() - t0;
    expect({ ok: r.ok, failed: r.tests.filter((t) => t.status !== 'passed').map((t) => t.name) }).toEqual({ ok: true, failed: [] });
    expect(elapsed).toBeLessThan(25_000);
  });

  it('mỗi test có assertion (expect.hasAssertions) — kể cả test async', async () => {
    const r = await runSpec(SPECS, { assertionsRequired: true });
    expect({ ok: r.ok, failed: r.tests.filter((t) => t.status !== 'passed').map((t) => t.name) }).toEqual({ ok: true, failed: [] });
  });

  it.each([11, 222, 3333])('thứ tự chạy ngẫu nhiên (seed %i) vẫn xanh', async (seed) => {
    const r = await runSpec(SPECS, { extraArgs: ['--randomize', `--seed=${seed}`] });
    expect({ ok: r.ok, failed: r.tests.filter((t) => t.status !== 'passed').map((t) => t.name) }).toEqual({ ok: true, failed: [] });
  });

  it('không dùng đồng hồ thật: không có `await new Promise(... setTimeout ...)`, `sleep(` hay `Date.now()` để chờ trong spec', () => {
    for (const spec of SPECS) {
      const text = readFileSync(join(__dirname, '..', '..', spec), 'utf8');
      const stripped = text.replace(/jest\.(useFakeTimers|advanceTimersByTime(Async)?|useRealTimers)/g, '');
      expect({ spec, real: /new Promise\(\s*\(?\s*\w*\s*\)?\s*=>\s*setTimeout|\bsleep\s*\(|await\s+timer\(/.test(stripped) }).toEqual({ spec, real: false });
    }
  });

  it('spec dùng fake timers khi test thời gian (timeout.interceptor.spec.ts)', () => {
    const text = readFileSync(join(__dirname, '..', '..', SPECS[3]), 'utf8');
    expect(text).toMatch(/useFakeTimers/);
  });

  it('mock được dọn: spec nào spy lên Logger/console đều khôi phục (restoreAllMocks/mockRestore) để không rò sang spec khác', () => {
    for (const spec of SPECS) {
      const text = readFileSync(join(__dirname, '..', '..', spec), 'utf8');
      if (/jest\.spyOn\(/.test(text)) expect({ spec, restores: /restoreAllMocks|mockRestore|resetAllMocks|clearAllMocks/.test(text) }).toEqual({ spec, restores: true });
    }
  });
});
