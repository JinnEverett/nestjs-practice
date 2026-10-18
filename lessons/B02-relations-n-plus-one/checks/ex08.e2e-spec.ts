import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('B02 ex08 · 📏 N+1 tốn bao nhiêu khi số danh mục tăng?', () => {
  const file = join(__dirname, 'answers', 'ex08.md');
  const text = () => readFileSync(file, 'utf8');
  const rows = () =>
    text()
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean));

  it('có answers/ex08.md', () => {
    expect(existsSync(file)).toBe(true);
  });

  it('có mục dự đoán viết TRƯỚC bảng số đo', () => {
    const t = text();
    const predict = t.search(/dự đoán/i);
    const table = t.search(/^\|/m);
    expect(predict).toBeGreaterThanOrEqual(0);
    expect(table).toBeGreaterThan(predict);
  });

  it('bảng đo ít nhất ba mức số danh mục (≥ 10, ≥ 100, ≥ 1000), mỗi mức có ≥ 3 con số (số truy vấn và thời gian của hai cách)', () => {
    const data = rows().filter((c) => /^\d[\d.,_ ]*$/.test(c[0] ?? ''));
    const sizes = data.map((c) => Number((c[0] ?? '').replace(/[., _]/g, '')));
    expect(sizes.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...sizes)).toBeGreaterThanOrEqual(1000);
    expect(sizes.some((s) => s >= 10 && s < 100)).toBe(true);
    for (const c of data) expect({ row: c[0], numbers: c.slice(1).filter((x) => /^\d+(\.\d+)?$/.test(x)).length >= 3 }).toEqual({ row: c[0], numbers: true });
  });

  it('bảng cho thấy số truy vấn của cách ngây thơ tăng theo N (1 + N) còn cách dùng quan hệ thì không đổi', () => {
    const data = rows().filter((c) => /^\d[\d.,_ ]*$/.test(c[0] ?? ''));
    const naiveQueries = data.map((c) => Number(c[1]));
    const fixedQueries = data.map((c) => Number(c[2]));
    expect(Math.max(...naiveQueries)).toBeGreaterThan(Math.min(...naiveQueries) * 5);
    expect(new Set(fixedQueries).size).toBe(1);
  });

  it('kết luận (≥ 400 ký tự) gọi tên N+1, giải thích nguyên nhân và nêu cách sửa (JOIN/relations/nạp theo lô) và cái giá của JOIN nhiều quan hệ', () => {
    const t = text();
    expect(t).toMatch(/kết luận/i);
    expect(t).toMatch(/n ?\+ ?1/i);
    expect(t).toMatch(/join|relations|leftJoinAndSelect|theo lô|in \(/i);
    expect(t).toMatch(/tích (đề các|descartes)|cartesian|nhân dòng|phình|bùng nổ/i);
    expect(t.length).toBeGreaterThan(400);
  });
});
