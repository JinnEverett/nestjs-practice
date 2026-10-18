import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Đáp án tham chiếu: lập luận nằm trong README "Chọn tầng test".
const KEY: Record<number, string> = { 1: 'unit', 2: 'e2e', 3: 'unit', 4: 'e2e', 5: 'none', 6: 'component', 7: 'e2e', 8: 'none', 9: 'e2e', 10: 'component' };

describe('Q04 ex01 · chọn tầng test cho từng tình huống', () => {
  const file = join(__dirname, 'answers', 'ex01.txt');
  const read = () =>
    new Map(
      readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
        .map((l) => /^(\d+)\s*[:.)-]\s*(unit|component|e2e|none)\s*$/i.exec(l))
        .filter((m): m is RegExpExecArray => m !== null)
        .map((m) => [Number(m[1]), m[2].toLowerCase()] as const),
    );

  it('có answers/ex01.txt với đủ 10 dòng dạng "1: unit|component|e2e|none"', () => {
    expect(existsSync(file)).toBe(true);
    expect([...read().keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('chọn đúng tầng ít nhất 8/10 tình huống', () => {
    const guess = read();
    const wrong = Object.entries(KEY).filter(([n, v]) => guess.get(Number(n)) !== v).map(([n]) => Number(n));
    if (wrong.length > 2) throw new Error(`Sai ${wrong.length}/10 (các câu: ${wrong.join(', ')}). Đọc lại tiêu chí chọn tầng trong README rồi cân nhắc lại.`);
  });

  it('(giáo dục) không dồn hết vào một tầng', () => {
    const values = [...read().values()];
    expect(new Set(values).size).toBeGreaterThanOrEqual(3);
  });
});
