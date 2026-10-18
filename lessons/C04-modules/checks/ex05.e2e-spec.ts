import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ClockService } from '../../src/clock/clock.service';
import { SharedModule } from '../../src/shared/shared.module';
import { createTestApp } from './_kit';
import { createProduct, postOrder } from './_fixtures';

describe('C04 ex05 · SharedModule @Global', () => {
  it('module không import gì vẫn inject được ClockService nhờ SharedModule', async () => {
    @Injectable()
    class UsesClock {
      constructor(readonly clock: ClockService) {}
    }
    @Module({ providers: [UsesClock] })
    class Feature {}
    const ref = await Test.createTestingModule({ imports: [SharedModule, Feature] }).compile();
    expect(ref.get(UsesClock, { strict: false }).clock.now()).toBeInstanceOf(Date);
    await ref.close();
  });

  it('không có SharedModule thì module đó không dùng được ClockService (tính "global" đến từ SharedModule)', async () => {
    @Injectable()
    class UsesClock {
      constructor(readonly clock: ClockService) {}
    }
    @Module({ providers: [UsesClock] })
    class Feature {}
    await expect(Test.createTestingModule({ imports: [Feature] }).compile()).rejects.toThrow(/resolve dependencies/i);
  });

  it('chỉ có MỘT instance ClockService trong ứng dụng; override một lần là đủ', async () => {
    const fixed = new Date('2026-07-08T09:10:11.000Z');
    const app = await createTestApp({ customize: (b) => b.overrideProvider(ClockService).useValue({ now: () => fixed }) });
    try {
      const p = await createProduct(app, { stock: 2 });
      const o = (await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] })).body;
      expect(o.createdAt).toBe(fixed.toISOString());
    } finally {
      await app.close();
    }
  });
});
