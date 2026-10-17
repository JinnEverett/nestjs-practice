import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runOrder } from './_order';

describe('C10 ex02 · 🔮 thứ tự khởi tạo và tắt', () => {
  const file = join(__dirname, 'answers', 'ex02.txt');
  const read = () => readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  it('có answers/ex02.txt: đúng 11 dòng', () => {
    expect(existsSync(file)).toBe(true);
    expect(read()).toHaveLength(11);
  });

  it('đúng ít nhất 9/11 vị trí (thứ tự thật lấy từ lần chạy thật)', async () => {
    const real = await runOrder();
    const guess = read();
    const wrong = real.map((e, i) => ({ i: i + 1, e, got: guess[i] })).filter((x) => x.e !== x.got);
    if (wrong.length > 2) throw new Error(`Sai ${wrong.length}/11 vị trí, đầu tiên là vị trí ${wrong[0].i} (bạn ghi "${wrong[0].got}"). Chạy snippet thật để so sánh.`);
  });

  it('hiểu hai quy tắc: dependency khởi tạo trước, và tắt theo thứ tự NGƯỢC', () => {
    const g = read();
    expect(g.indexOf('Db:constructor')).toBeLessThan(g.indexOf('Service:constructor'));
    expect(g.indexOf('Db:onModuleInit')).toBeLessThan(g.indexOf('Service:onModuleInit'));
    expect(g.indexOf('Service:onModuleDestroy')).toBeLessThan(g.indexOf('Db:onModuleDestroy'));
    expect(g.indexOf('Service:onApplicationBootstrap')).toBeLessThan(g.indexOf('Service:onModuleDestroy'));
  });
});
