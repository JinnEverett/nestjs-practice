import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileExists } from './_kit';
import { runSpec, survivors } from './_mutation';
import { LOW_STOCK_MUTANTS } from './_mutants';

const SPEC = 'src/products/low-stock.spec.ts';
jest.setTimeout(600_000);

describe('Q04 ex03 · TDD: selectLowStock', () => {
  it('có src/products/low-stock.ts và low-stock.spec.ts', () => {
    expect(fileExists('src', 'products', 'low-stock.ts')).toBe(true);
    expect(fileExists('src', 'products', 'low-stock.spec.ts')).toBe(true);
  });

  it('spec xanh trên cài đặt của bạn, mỗi test có assertion, phủ >= 90% nhánh', async () => {
    const a = await runSpec(SPEC, { assertionsRequired: true });
    expect({ ok: a.ok, out: a.ok ? '' : a.output }).toEqual({ ok: true, out: '' });
    const r = await runSpec(SPEC, { coverageFor: ['src/products/low-stock.ts'] });
    expect(r.branchPct).toBeGreaterThanOrEqual(90);
  });

  it('spec bắt được >= 80% lỗi cài sẵn', async () => {
    const { survived, killed } = await survivors(SPEC, 'src/products/low-stock.ts', '_ref_low_stock.ts', LOW_STOCK_MUTANTS);
    const need = Math.ceil(LOW_STOCK_MUTANTS.length * 0.8);
    if (killed < need) throw new Error(`Chỉ bắt ${killed}/${LOW_STOCK_MUTANTS.length} lỗi (cần ${need}). Chưa có test cho: ${survived.join('; ')}`);
  });

  describe('nhật ký TDD answers/ex03.md', () => {
    const file = join(__dirname, 'answers', 'ex03.md');
    const text = () => readFileSync(file, 'utf8');

    it('có file nhật ký', () => {
      expect(existsSync(file)).toBe(true);
    });

    it('ít nhất 3 vòng "## Vòng N", mỗi vòng có Red (test đỏ), Green (code tối thiểu) và Refactor', () => {
      const cycles = text().split(/^##\s+Vòng\s+\d+/im).slice(1);
      expect(cycles.length).toBeGreaterThanOrEqual(3);
      for (const [i, c] of cycles.entries()) {
        expect({ cycle: i + 1, red: /red|đỏ/i.test(c) }).toEqual({ cycle: i + 1, red: true });
        expect({ cycle: i + 1, green: /green|xanh/i.test(c) }).toEqual({ cycle: i + 1, green: true });
        expect({ cycle: i + 1, refactor: /refactor|dọn/i.test(c) }).toEqual({ cycle: i + 1, refactor: true });
      }
    });

    it('mỗi vòng dán kết quả chạy thật của test đỏ (có FAIL / ✕ / Expected / Received) và có tên test', () => {
      const cycles = text().split(/^##\s+Vòng\s+\d+/im).slice(1);
      for (const [i, c] of cycles.entries()) {
        expect({ cycle: i + 1, failure: /FAIL|✕|Expected|Received|thất bại/i.test(c) }).toEqual({ cycle: i + 1, failure: true });
        expect({ cycle: i + 1, named: /it\(|test\(|"[^"]{8,}"|`[^`]{8,}`/.test(c) }).toEqual({ cycle: i + 1, named: true });
      }
    });

    it('có phần "Nhận xét" ngắn: điều gì TDD thay đổi trong cách bạn thiết kế hàm', () => {
      expect(text()).toMatch(/^#+\s*Nhận xét/im);
      expect(text().length).toBeGreaterThan(600);
    });
  });
});
