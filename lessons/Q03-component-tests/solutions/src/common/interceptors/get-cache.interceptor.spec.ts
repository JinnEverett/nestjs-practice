import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, lastValueFrom, of, throwError } from 'rxjs';
import { ClockService } from '../../clock/clock.service';
import { CacheTtl, GetCacheInterceptor, MAX_CACHE_ENTRIES } from './get-cache.interceptor';

class Ctrl {
  @CacheTtl(10)
  cached(): void {}
  plain(): void {}
}

interface FakeRes { headers: Record<string, string>; setHeader(k: string, v: string): void }
const makeCtx = (method: string, url: string, handlerName: 'cached' | 'plain' = 'cached') => {
  const res: FakeRes = { headers: {}, setHeader(k, v) { this.headers[k] = v; } };
  const context = {
    switchToHttp: () => ({ getRequest: () => ({ method, originalUrl: url }), getResponse: () => res }),
    getHandler: () => Ctrl.prototype[handlerName],
    getClass: () => Ctrl,
  } as unknown as ExecutionContext;
  return { context, res };
};

describe('GetCacheInterceptor', () => {
  let now: Date;
  let interceptor: GetCacheInterceptor;
  beforeEach(() => {
    now = new Date('2026-01-01T00:00:00.000Z');
    interceptor = new GetCacheInterceptor(new Reflector(), { now: () => now } as unknown as ClockService);
  });

  const call = async (method: string, url: string, body: unknown, handlerName: 'cached' | 'plain' = 'cached') => {
    const { context, res } = makeCtx(method, url, handlerName);
    const next: CallHandler & { calls: number } = { calls: 0, handle() { this.calls++; return of(body); } };
    const result = await lastValueFrom(interceptor.intercept(context, next));
    return { result, res, calls: next.calls };
  };

  it('lần đầu MISS gọi handler, lần sau HIT không gọi handler và trả cùng body', async () => {
    const a = await call('GET', '/v1/products', { n: 1 });
    const b = await call('GET', '/v1/products', { n: 2 });
    expect([a.res.headers['X-Cache'], b.res.headers['X-Cache']]).toEqual(['MISS', 'HIT']);
    expect(b.calls).toBe(0);
    expect(b.result).toEqual({ n: 1 });
  });

  it('khóa gồm query: URL khác → mục khác', async () => {
    await call('GET', '/v1/products?page=1', { p: 1 });
    const other = await call('GET', '/v1/products?page=2', { p: 2 });
    expect(other.res.headers['X-Cache']).toBe('MISS');
    expect(other.result).toEqual({ p: 2 });
  });

  it('hết hạn theo giờ của ClockService: 9.999s vẫn HIT, đúng 10s trở đi MISS', async () => {
    await call('GET', '/x', { v: 1 });
    now = new Date(now.getTime() + 9_999);
    expect((await call('GET', '/x', { v: 2 })).res.headers['X-Cache']).toBe('HIT');
    now = new Date(now.getTime() + 1);
    const expired = await call('GET', '/x', { v: 3 });
    expect(expired.res.headers['X-Cache']).toBe('MISS');
    expect(expired.result).toEqual({ v: 3 });
  });

  it('route không có @CacheTtl: đi thẳng, không header, không cache', async () => {
    const a = await call('GET', '/p', { n: 1 }, 'plain');
    const b = await call('GET', '/p', { n: 2 }, 'plain');
    expect(a.res.headers['X-Cache']).toBeUndefined();
    expect(b.result).toEqual({ n: 2 });
    expect(b.calls).toBe(1);
  });

  it('lỗi của handler không được cache', async () => {
    const { context } = makeCtx('GET', '/err');
    await expect(firstValueFrom(interceptor.intercept(context, { handle: () => throwError(() => new Error('boom')) }))).rejects.toThrow('boom');
    const after = await call('GET', '/err', { ok: true });
    expect(after.res.headers['X-Cache']).toBe('MISS');
    expect(after.result).toEqual({ ok: true });
  });

  it('lưu và trả bản sao: sửa body đã nhận không làm hỏng cache', async () => {
    const original = { list: [1, 2, 3] };
    const miss = await call('GET', '/copy', original);
    (miss.result as typeof original).list.push(99);
    original.list.length = 0;
    const hit = await call('GET', '/copy', { list: ['x'] });
    expect(hit.result).toEqual({ list: [1, 2, 3] });
    (hit.result as typeof original).list.push(4);
    expect((await call('GET', '/copy', {})).result).toEqual({ list: [1, 2, 3] });
  });

  it('request ghi THÀNH CÔNG xóa toàn bộ cache; ghi thất bại thì không', async () => {
    await call('GET', '/a', { v: 1 });
    await call('GET', '/b', { v: 1 });
    const { context } = makeCtx('POST', '/w');
    await expect(firstValueFrom(interceptor.intercept(context, { handle: () => throwError(() => new Error('400')) }))).rejects.toThrow();
    expect((await call('GET', '/a', { v: 2 })).res.headers['X-Cache']).toBe('HIT');
    for (const method of ['POST', 'PATCH', 'DELETE']) {
      await call('GET', '/a', { v: 3 });
      await call(method, '/w', { ok: true });
      expect({ method, h: (await call('GET', '/a', { v: 4 })).res.headers['X-Cache'] }).toEqual({ method, h: 'MISS' });
    }
  });

  it('có trần số mục: mục cũ nhất bị loại khi vượt MAX_CACHE_ENTRIES', async () => {
    await call('GET', '/oldest', { id: 'oldest' });
    for (let i = 0; i < MAX_CACHE_ENTRIES; i++) await call('GET', `/fill-${i}`, { i });
    expect((await call('GET', '/oldest', { id: 'again' })).res.headers['X-Cache']).toBe('MISS');
    expect((await call('GET', `/fill-${MAX_CACHE_ENTRIES - 1}`, {})).res.headers['X-Cache']).toBe('HIT');
  });
});
