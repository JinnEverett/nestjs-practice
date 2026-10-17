import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { ORDER_WINDOW_MUTANTS } from './_mutants';

const SPEC = 'src/demo/order-window.spec.ts';
jest.setTimeout(900_000);

describe('Q04 ex05 · 🔴 "Test xanh ở máy dev, đỏ ở CI và đỏ lúc nửa đêm"', () => {
  const text = () => readFileSync(join(__dirname, '..', '..', SPEC), 'utf8');

  it('có src/demo/order-window.ts và spec (sao chép từ starter/)', () => {
    expect(fileExists('src', 'demo', 'order-window.ts')).toBe(true);
    expect(fileExists('src', 'demo', 'order-window.spec.ts')).toBe(true);
  });

  it('không dùng giờ địa phương: không có `new Date(năm, tháng, ...)` nhiều đối số số học, không getHours()/getDay()', () => {
    expect(text()).not.toMatch(/new Date\(\s*\d{4}\s*,\s*\d/);
    expect(text()).not.toMatch(/\.(getHours|getDay|getDate|getMinutes)\(\)/);
  });

  it('không phụ thuộc đồng hồ thật: nếu có new Date() / Date.now() thì phải giả đồng hồ (setSystemTime)', () => {
    const t = text();
    if (/new Date\(\s*\)|Date\.now\(\)/.test(t)) expect(t).toMatch(/useFakeTimers[\s\S]*setSystemTime|setSystemTime/);
  });

  it.each(['UTC', 'Asia/Ho_Chi_Minh', 'America/Los_Angeles', 'Pacific/Kiritimati'])('xanh khi máy chủ ở múi giờ %s', async (TZ) => {
    const r = await runSpec(SPEC, { env: { TZ } });
    expect({ TZ, ok: r.ok, failed: r.tests.filter((t) => t.status !== 'passed').map((t) => t.name) }).toEqual({ TZ, ok: true, failed: [] });
  });

  it.each([5, 99, 12345])('xanh với thứ tự chạy ngẫu nhiên (seed %i): test không phụ thuộc trạng thái dùng chung', async (seed) => {
    const r = await runSpec(SPEC, { extraArgs: ['--randomize', `--seed=${seed}`], env: { TZ: 'America/Los_Angeles' } });
    expect({ ok: r.ok, failed: r.tests.filter((t) => t.status !== 'passed').map((t) => t.name) }).toEqual({ ok: true, failed: [] });
  });

  it('sửa flaky không được xóa nghĩa của test: vẫn bắt >= 80% lỗi cài sẵn', async () => {
    const { survived, killed } = await survivors(SPEC, 'src/demo/order-window.ts', '_ref_order_window.ts', ORDER_WINDOW_MUTANTS, { env: { TZ: 'Asia/Tokyo' } });
    const need = Math.ceil(ORDER_WINDOW_MUTANTS.length * 0.8);
    if (killed < need) throw new Error(`Chỉ bắt ${killed}/${ORDER_WINDOW_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
  });
});
