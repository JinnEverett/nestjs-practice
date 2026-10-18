import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { runSpec } from './_mutation';
import { EX05_SNIPPET } from './_snippet';

jest.setTimeout(120_000);

describe('Q01 ex05 · 🔮 đoán kết quả test (ngữ nghĩa của mock)', () => {
  const file = join(__dirname, 'answers', 'ex05.txt');

  it('có answers/ex05.txt với 8 dòng dạng "t1: pass" hoặc "t1: fail"', () => {
    expect(existsSync(file)).toBe(true);
    const lines = readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    expect(lines).toHaveLength(8);
    for (const l of lines) expect(l).toMatch(/^t[1-8]\s*:\s*(pass|fail)$/i);
  });

  it('đoán đúng ít nhất 7/8 (kết quả lấy từ lần chạy thật)', async () => {
    const real = await runSpec('src/_q01/ex05.spec.ts', { extraFiles: { 'src/_q01/ex05.spec.ts': EX05_SNIPPET } });
    const status = new Map(real.tests.map((t) => [t.name, t.status === 'passed' ? 'pass' : 'fail']));
    expect(status.size).toBe(8);
    const guess = new Map(
      readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
        .map((l) => l.split(/\s*:\s*/) as [string, string]).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]),
    );
    const wrong = [...status].filter(([k, v]) => guess.get(k) !== v).map(([k]) => k);
    if (wrong.length > 1) throw new Error(`Sai ${wrong.length}/8 câu: ${wrong.join(', ')}. Chạy snippet thật để xem vì sao.`);
  });
});
