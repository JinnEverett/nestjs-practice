import { Global, INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { ClockService } from '../../src/clock/clock.service';
import { NOW, ORDER_NOTIFIER, ORDER_READER } from '../../src/orders/orders.tokens';
import { OrdersService } from '../../src/orders/orders.service';
import { createTestApp, http, readSource } from './_kit';
import { createProduct, postOrder } from './_fixtures';

const FIXED = new Date('2026-03-04T05:06:07.000Z');

describe('C03 ex05 · useFactory, useExisting, @Optional', () => {
  it('useFactory: NOW lấy giờ từ ClockService → createdAt/updatedAt của đơn theo clock', async () => {
    const app = await createTestApp({
      customize: (b) => b.overrideProvider(ClockService).useValue({ now: () => FIXED }),
    });
    try {
      const p = await createProduct(app, { stock: 3 });
      const res = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] });
      expect(res.body.createdAt).toBe(FIXED.toISOString());
      expect(res.body.updatedAt).toBe(FIXED.toISOString());
      const now = app.get<() => Date>(NOW, { strict: false });
      expect(now()).toEqual(FIXED);
    } finally {
      await app.close();
    }
  });

  it('useExisting: ORDER_READER là CÙNG instance với OrdersService', async () => {
    const app = await createTestApp();
    try {
      expect(app.get(ORDER_READER, { strict: false })).toBe(app.get(OrdersService, { strict: false }));
    } finally {
      await app.close();
    }
  });

  it('@Optional: không có ORDER_NOTIFIER thì app vẫn chạy; source dùng @Optional()', async () => {
    const app = await createTestApp();
    try {
      const p = await createProduct(app, { stock: 3 });
      expect((await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] })).status).toBe(201);
    } finally {
      await app.close();
    }
    expect(readSource('src', 'orders', 'orders.service.ts')).toMatch(/@Optional\(\)/);
  });

  const withNotifier = async (notifier: { orderCreated: jest.Mock }): Promise<INestApplication> => {
    @Global()
    @Module({ providers: [{ provide: ORDER_NOTIFIER, useValue: notifier }], exports: [ORDER_NOTIFIER] })
    class FakeNotifierModule {}
    const ref = await Test.createTestingModule({ imports: [AppModule, FakeNotifierModule] }).compile();
    const app = ref.createNestApplication();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const setup = require('../../src/app.setup').configureApp;
    await setup(app);
    await app.init();
    return app;
  };

  it('có ORDER_NOTIFIER thì được gọi một lần với đơn vừa tạo', async () => {
    const notifier = { orderCreated: jest.fn() };
    const app = await withNotifier(notifier);
    try {
      const p = await createProduct(app, { stock: 3 });
      const res = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] });
      expect(res.status).toBe(201);
      expect(notifier.orderCreated).toHaveBeenCalledTimes(1);
      expect(notifier.orderCreated).toHaveBeenCalledWith(expect.objectContaining({ id: res.body.id, totalAmount: res.body.totalAmount }));
    } finally {
      await app.close();
    }
  });

  it('notifier ném lỗi thì đơn vẫn được tạo (201) và tồn kho đã trừ', async () => {
    const notifier = { orderCreated: jest.fn().mockRejectedValue(new Error('smtp down')) };
    const app = await withNotifier(notifier);
    try {
      const p = await createProduct(app, { stock: 3 });
      const res = await postOrder(app, { items: [{ productId: p.id, quantity: 2 }] });
      expect(res.status).toBe(201);
      expect((await http(app).get(`/v1/orders/${res.body.id}`)).status).toBe(200);
      expect((await http(app).get(`/v1/products/${p.id}`)).body.stock).toBe(1);
    } finally {
      await app.close();
    }
  });
});
