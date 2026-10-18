import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('B03 ex08 · 📏 Ba cách nạp dữ liệu: save() từng dòng, theo lô, INSERT ... SELECT', () => {
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

  it('bảng đo ít nhất ba mức số dòng (≥ 1 nghìn, ≥ 10 nghìn, ≥ 100 nghìn), mỗi mức có ≥ 3 con số (thời gian của ba cách)', () => {
    const data = rows().filter((c) => /^\d[\d.,_ ]*$/.test(c[0] ?? ''));
    const sizes = data.map((c) => Number((c[0] ?? '').replace(/[., _]/g, '')));
    expect(sizes.length).toBeGreaterThanOrEqual(3);
    expect(Math.max(...sizes)).toBeGreaterThanOrEqual(100_000);
    expect(sizes.some((s) => s >= 1_000 && s < 10_000)).toBe(true);
    for (const c of data) expect({ row: c[0], numbers: c.slice(1).filter((x) => /^\d+(\.\d+)?$/.test(x)).length >= 3 }).toEqual({ row: c[0], numbers: true });
  });

  it('kết luận (≥ 400 ký tự) giải thích vì sao khác nhau (vòng khứ hồi, số tham số tối đa của một câu lệnh, ánh xạ entity) và khi nào dùng từng cách', () => {
    const t = text();
    expect(t).toMatch(/kết luận/i);
    expect(t).toMatch(/khứ hồi|round ?trip|độ trễ/i);
    expect(t).toMatch(/65 ?535|65\.535|tham số|chia lô|theo lô|batch/i);
    expect(t).toMatch(/generate_series|insert ?\.\.\. ?select|insert into .* select/i);
    expect(t.length).toBeGreaterThan(400);
  });
});
