import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { createTestApp } from './_kit';
import { RequestScopedService, SingletonService, TransientService } from '../../src/lifecycle/scopes';

describe('C10 ex05 · ModuleRef', () => {
  it('get() lấy provider singleton, cùng instance với injection', async () => {
    const app = await createTestApp();
    try {
      const ref = app.get(ModuleRef);
      expect(ref.get(SingletonService, { strict: false })).toBe(app.get(SingletonService, { strict: false }));
    } finally {
      await app.close();
    }
  });

  it('get() trên provider REQUEST-scoped bị từ chối; resolve() thì được', async () => {
    const app = await createTestApp();
    try {
      const ref = app.get(ModuleRef);
      expect(() => ref.get(RequestScopedService, { strict: false })).toThrow();
      const a = await ref.resolve(RequestScopedService);
      expect(a).toBeInstanceOf(RequestScopedService);
      expect(a.requestId).toBeUndefined(); // ngoài HTTP không có request: provider phải chịu được
    } finally {
      await app.close();
    }
  });

  it('resolve() không contextId → mỗi lần một instance mới; cùng contextId → dùng chung', async () => {
    const app = await createTestApp();
    try {
      const ref = app.get(ModuleRef);
      const a = await ref.resolve(RequestScopedService);
      const b = await ref.resolve(RequestScopedService);
      expect(a).not.toBe(b);
      const ctx = ContextIdFactory.create();
      const c = await ref.resolve(RequestScopedService, ctx);
      const d = await ref.resolve(RequestScopedService, ctx);
      expect(c).toBe(d);
      expect(c).not.toBe(a);
    } finally {
      await app.close();
    }
  });

  it('resolve() TransientService: mỗi lần một instance', async () => {
    const app = await createTestApp();
    try {
      const ref = app.get(ModuleRef);
      const a = await ref.resolve(TransientService);
      const b = await ref.resolve(TransientService);
      expect(a).not.toBe(b);
    } finally {
      await app.close();
    }
  });
});
