import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runLifecycle } from './_lifecycle';

describe('C08 ex07 · 🔮 đoán thứ tự lifecycle', () => {
  const file = join(__dirname, 'answers', 'ex07.txt');
  const read = () =>
    readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  it('có answers/ex07.txt: mỗi dòng một sự kiện, đúng 14 dòng', () => {
    expect(existsSync(file)).toBe(true);
    expect(read()).toHaveLength(14);
  });

  it('đoán đúng vị trí của ít nhất 12/14 sự kiện (thứ tự thật lấy từ lần chạy thật)', async () => {
    const real = await runLifecycle();
    expect(real).toHaveLength(14);
    const guess = read();
    const wrong = real.map((e, i) => ({ i: i + 1, e, got: guess[i] })).filter((x) => x.e !== x.got);
    if (wrong.length > 2) throw new Error(`Sai ${wrong.length}/14 vị trí, ví dụ vị trí ${wrong[0].i}: bạn ghi "${wrong[0].got}". Hãy chạy thật để so sánh.`);
  });

  it('đoán đúng cặp quan trọng: guard luôn trước interceptor-before, interceptor-after theo thứ tự ngược', async () => {
    const guess = read();
    const idx = (n: string) => guess.indexOf(n);
    expect(idx('guard:route')).toBeLessThan(idx('int:global:before'));
    expect(idx('int:route:after')).toBeLessThan(idx('int:global:after'));
  });
});
