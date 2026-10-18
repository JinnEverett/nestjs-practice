import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('C10 ex08 · 📏 đo DEFAULT vs REQUEST scope', () => {
  const file = join(__dirname, 'answers', 'ex08.md');

  it('có answers/ex08.md', () => {
    expect(existsSync(file)).toBe(true);
  });

  it('có dự đoán viết TRƯỚC khi đo (mục "Dự đoán") và kết quả (mục "Kết quả")', () => {
    const t = readFileSync(file, 'utf8');
    expect(t).toMatch(/dự đoán/i);
    expect(t).toMatch(/kết quả/i);
    expect(t.length).toBeGreaterThan(300);
  });

  it('có bảng số đo cho cả hai kịch bản (SINGLETON/DEFAULT và REQUEST), ít nhất 2 mức conns, có RPS và p99', () => {
    const t = readFileSync(file, 'utf8');
    const rows = t
      .split('\n')
      .filter((l) => l.trim().startsWith('|'))
      .map((l) => l.split('|').map((c) => c.trim()).filter(Boolean))
      .filter((cells) => cells.filter((c) => /^\d+(\.\d+)?$/.test(c)).length >= 3);
    expect(rows.length).toBeGreaterThanOrEqual(4);
    expect(t).toMatch(/default|singleton/i);
    expect(t).toMatch(/request/i);
    expect(t).toMatch(/rps/i);
    expect(t).toMatch(/p99/i);
  });

  it('có giải thích nguyên nhân (nhắc tới việc dựng lại instance / chi phí cho mỗi request)', () => {
    const t = readFileSync(file, 'utf8');
    expect(t).toMatch(/(dựng lại|khởi tạo lại|instance|constructor)/i);
    expect(t).toMatch(/(mỗi request|per request|mỗi lần)/i);
  });
});
