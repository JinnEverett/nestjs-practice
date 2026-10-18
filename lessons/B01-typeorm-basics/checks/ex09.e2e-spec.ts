import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('B01 ex09 · 📏 Bao nhiêu dòng thì GET /v1/products bắt đầu "nặng"?', () => {
  const file = join(__dirname, 'answers', 'ex09.md');
  const text = () => readFileSync(file, 'utf8');
  const rows = () =>
    text()
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean));

  it('có answers/ex09.md', () => {
    expect(existsSync(file)).toBe(true);
  });

  it('có mục dự đoán viết TRƯỚC bảng số đo', () => {
    const t = text();
    const predict = t.search(/dự đoán/i);
    const table = t.search(/^\|/m);
    expect(predict).toBeGreaterThanOrEqual(0);
    expect(table).toBeGreaterThan(predict);
  });

  it('bảng đo ít nhất ba mức số dòng (≥ 1 nghìn, ≥ 10 nghìn, ≥ 100 nghìn), mỗi dòng có ít nhất hai con số (req/s hoặc ms)', () => {
    const data = rows().filter((c) => /^\d[\d.,_ ]*$/.test(c[0] ?? ''));
    const sizes = data.map((c) => Number((c[0] ?? '').replace(/[., _]/g, '')));
    expect(sizes.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...sizes)).toBeGreaterThanOrEqual(100_000);
    expect(sizes.some((s) => s >= 1_000 && s < 10_000)).toBe(true);
    for (const c of data) expect({ row: c[0], numbers: c.slice(1).filter((x) => /^\d+(\.\d+)?$/.test(x)).length >= 2 }).toEqual({ row: c[0], numbers: true });
  });

  it('kết luận (≥ 400 ký tự) chỉ ra nguyên nhân (đọc cả bảng rồi lọc/phân trang ở tầng ứng dụng) và hướng sửa (đẩy lọc/sắp xếp/LIMIT xuống DB)', () => {
    const t = text();
    expect(t).toMatch(/kết luận/i);
    expect(t).toMatch(/findAll|toàn bộ|cả bảng|mọi dòng/i);
    expect(t).toMatch(/limit|offset|phân trang|where|order by|query ?builder|b04/i);
    expect(t.length).toBeGreaterThan(400);
  });
});
