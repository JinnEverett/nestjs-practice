import { createTestApp } from './_kit';
import { BROKER, Broker } from '../../src/lifecycle/broker';
import { LifecycleJournal } from '../../src/lifecycle/lifecycle-journal';

describe('C10 ex03 · provider bất đồng bộ (BROKER)', () => {
  it('inject nhận GIÁ TRỊ đã resolve, không phải Promise; kết nối xong trước mọi onModuleInit', async () => {
    const app = await createTestApp();
    try {
      const broker = app.get<Broker>(BROKER, { strict: false });
      expect(typeof (broker as unknown as { then?: unknown }).then).toBe('undefined');
      expect(broker.connected).toBe(true);
      const events = app.get(LifecycleJournal, { strict: false }).events;
      expect(events.indexOf('broker:connected')).toBeGreaterThanOrEqual(0);
      expect(events.indexOf('broker:connected')).toBeLessThan(events.indexOf('StartupProbe:onModuleInit'));
    } finally {
      await app.close();
    }
  });

  it('tắt ứng dụng thì đóng broker đúng một lần', async () => {
    const app = await createTestApp();
    const journal = app.get(LifecycleJournal, { strict: false });
    expect(journal.events).not.toContain('broker:closed');
    await app.close();
    expect(journal.events.filter((e) => e === 'broker:closed')).toHaveLength(1);
    expect(journal.events.indexOf('broker:closed')).toBeGreaterThan(journal.events.indexOf('StartupProbe:onModuleDestroy'));
  });

  it('factory lỗi → ứng dụng KHÔNG khởi động và lỗi nêu rõ nguyên nhân', async () => {
    await expect(
      createTestApp({
        customize: (b) =>
          b.overrideProvider(BROKER).useFactory({
            factory: async () => {
              throw new Error('broker down');
            },
          }),
      }),
    ).rejects.toThrow('broker down');
  });

  it('có thể thay broker giả trong test, và đóng broker giả đó khi tắt', async () => {
    const close = jest.fn(async () => undefined);
    const app = await createTestApp({ customize: (b) => b.overrideProvider(BROKER).useValue({ connected: true, close }) });
    await app.close();
    expect(close).toHaveBeenCalledTimes(1);
  });
});
