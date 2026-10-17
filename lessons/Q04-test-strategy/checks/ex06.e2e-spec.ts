import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Q04 ex06 · 📏 ngân sách kim tự tháp test', () => {
  const file = join(__dirname, 'answers', 'ex06.md');
  const text = () => readFileSync(file, 'utf8');

  it('có answers/ex06.md', () => {
    expect(existsSync(file)).toBe(true);
  });

  it('bảng đếm và đo thời gian ba tầng: unit, component, e2e (số test, tổng giây, giây trung bình mỗi test)', () => {
    const rows = text()
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean));
    const byLayer = (re: RegExp) => rows.find((cells) => re.test(cells[0] ?? ''));
    for (const [name, re] of [['unit', /unit/i], ['component', /component|thành phần/i], ['e2e', /e2e/i]] as const) {
      const row = byLayer(re);
      expect({ name, found: Boolean(row) }).toEqual({ name, found: true });
      expect({ name, nums: row!.filter((c) => /^\d+(\.\d+)?$/.test(c)).length >= 3 }).toEqual({ name, nums: true });
    }
  });

  it('có dự đoán kích thước tầng TRƯỚC khi đếm và so sánh với tỉ lệ 70/20/10', () => {
    expect(text()).toMatch(/dự đoán/i);
    expect(text()).toMatch(/70\s*\/\s*20\s*\/\s*10|70%|kim tự tháp|pyramid/i);
  });

  it('chỉ ra ít nhất một test nên XÓA hoặc KHÔNG viết và lý do (chi phí/giá trị)', () => {
    expect(text()).toMatch(/(nên xóa|không nên viết|không đáng|bỏ test|xóa test)/i);
    expect(text().length).toBeGreaterThan(500);
  });
});
