import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Q02 ex06 · 📏 ba chiến lược giữ DB sạch', () => {
  const file = join(__dirname, 'answers', 'ex06.md');
  const text = () => readFileSync(file, 'utf8');

  it('có answers/ex06.md', () => {
    expect(existsSync(file)).toBe(true);
  });

  it('bảng đo ba chiến lược: TRUNCATE mỗi test, rollback transaction (hoặc DELETE), tạo lại DB/schema — có số test, tổng ms và ms/test', () => {
    const rows = text()
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean));
    const find = (re: RegExp) => rows.find((c) => re.test(c[0] ?? ''));
    for (const [name, re] of [['truncate', /truncate/i], ['rollback/delete', /rollback|delete|transaction/i], ['tạo lại', /tạo lại|recreate|schema|database|db/i]] as const) {
      const row = find(re);
      expect({ name, found: Boolean(row) }).toEqual({ name, found: true });
      expect({ name, numbers: (row ?? []).filter((c) => /^\d+(\.\d+)?$/.test(c)).length >= 2 }).toEqual({ name, numbers: true });
    }
  });

  it('có dự đoán trước khi đo và chọn một chiến lược kèm lý do (đánh đổi tốc độ, cô lập, độ chân thực)', () => {
    expect(text()).toMatch(/dự đoán/i);
    expect(text()).toMatch(/(chọn|chiến lược nào|quyết định)/i);
    expect(text()).toMatch(/(cô lập|isolat|song song|chân thực|nhanh)/i);
    expect(text().length).toBeGreaterThan(500);
  });
});
