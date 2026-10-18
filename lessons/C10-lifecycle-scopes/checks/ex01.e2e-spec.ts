import { createTestApp } from './_kit';
import { LifecycleJournal } from '../../src/lifecycle/lifecycle-journal';
import { StartupProbe } from '../../src/lifecycle/startup.probe';

describe('C10 ex01 · lifecycle hooks của StartupProbe', () => {
  it('khởi động: onModuleInit rồi onApplicationBootstrap (hook async được CHỜ xong)', async () => {
    const app = await createTestApp();
    try {
      const journal = app.get(LifecycleJournal, { strict: false });
      expect(app.get(StartupProbe, { strict: false })).toBeInstanceOf(StartupProbe);
      expect(journal.events.filter((e) => e.startsWith('StartupProbe:'))).toEqual([
        'StartupProbe:onModuleInit',
        'StartupProbe:onApplicationBootstrap',
      ]);
    } finally {
      await app.close();
    }
  });

  it('tắt: onModuleDestroy → beforeApplicationShutdown → onApplicationShutdown', async () => {
    const app = await createTestApp();
    const journal = app.get(LifecycleJournal, { strict: false });
    await app.close();
    expect(journal.events.filter((e) => e.startsWith('StartupProbe:'))).toEqual([
      'StartupProbe:onModuleInit',
      'StartupProbe:onApplicationBootstrap',
      'StartupProbe:onModuleDestroy',
      'StartupProbe:beforeApplicationShutdown',
      'StartupProbe:onApplicationShutdown',
    ]);
  });

  it('mỗi ứng dụng có sổ riêng (không dùng biến toàn cục cho trạng thái)', async () => {
    const a = await createTestApp();
    const b = await createTestApp();
    try {
      const ja = a.get(LifecycleJournal, { strict: false });
      const jb = b.get(LifecycleJournal, { strict: false });
      expect(ja).not.toBe(jb);
      expect(ja.events.filter((e) => e === 'StartupProbe:onModuleInit')).toHaveLength(1);
    } finally {
      await a.close();
      await b.close();
    }
  });
});
