import { CallHandler, ExecutionContext, NotFoundException, RequestTimeoutException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, Observable, throwError, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { DEFAULT_TIMEOUT_MS, Timeout, TimeoutInterceptor } from './timeout.interceptor';

class Ctrl {
  @Timeout(100)
  fast(): void {}
  plain(): void {}
}
@Timeout(300)
class SlowCtrl {
  inherit(): void {}
  @Timeout(50)
  override(): void {}
}

const ctx = (cls: new () => object, method: string): ExecutionContext =>
  ({ getHandler: () => (cls.prototype as Record<string, () => void>)[method], getClass: () => cls }) as unknown as ExecutionContext;
const handler = (obs: Observable<unknown>): CallHandler => ({ handle: () => obs });

describe('TimeoutInterceptor', () => {
  const interceptor = new TimeoutInterceptor(new Reflector());

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('mặc định 5000 ms', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(5000);
  });

  it('nhanh hơn hạn → trả kết quả', async () => {
    const out = interceptor.intercept(ctx(Ctrl, 'fast'), handler(timer(10).pipe(map(() => 'ok'))));
    const p = firstValueFrom(out);
    await jest.advanceTimersByTimeAsync(10);
    await expect(p).resolves.toBe('ok');
  });

  it('chậm hơn @Timeout ở handler → RequestTimeoutException; đúng hạn 99ms vẫn qua, 100ms thì hết', async () => {
    const ok = firstValueFrom(interceptor.intercept(ctx(Ctrl, 'fast'), handler(timer(99).pipe(map(() => 'ok')))));
    await jest.advanceTimersByTimeAsync(99);
    await expect(ok).resolves.toBe('ok');
    const late = firstValueFrom(interceptor.intercept(ctx(Ctrl, 'fast'), handler(timer(101).pipe(map(() => 'late')))));
    const assertion = expect(late).rejects.toBeInstanceOf(RequestTimeoutException);
    await jest.advanceTimersByTimeAsync(101);
    await assertion;
  });

  it('không có @Timeout → mặc định 5000ms', async () => {
    const p = firstValueFrom(interceptor.intercept(ctx(Ctrl, 'plain'), handler(timer(4999).pipe(map(() => 'ok')))));
    await jest.advanceTimersByTimeAsync(4999);
    await expect(p).resolves.toBe('ok');
    const late = firstValueFrom(interceptor.intercept(ctx(Ctrl, 'plain'), handler(timer(5001).pipe(map(() => 'late')))));
    const assertion = expect(late).rejects.toBeInstanceOf(RequestTimeoutException);
    await jest.advanceTimersByTimeAsync(5001);
    await assertion;
  });

  it('@Timeout ở controller được thừa kế; ở handler thì ghi đè controller', async () => {
    const inherit = firstValueFrom(interceptor.intercept(ctx(SlowCtrl, 'inherit'), handler(timer(250).pipe(map(() => 'ok')))));
    await jest.advanceTimersByTimeAsync(250);
    await expect(inherit).resolves.toBe('ok');
    const override = firstValueFrom(interceptor.intercept(ctx(SlowCtrl, 'override'), handler(timer(80).pipe(map(() => 'late')))));
    const assertion = expect(override).rejects.toBeInstanceOf(RequestTimeoutException);
    await jest.advanceTimersByTimeAsync(80);
    await assertion;
  });

  it('lỗi khác của handler đi qua nguyên vẹn (không bị đổi thành 408)', async () => {
    const err = new NotFoundException('x');
    await expect(firstValueFrom(interceptor.intercept(ctx(Ctrl, 'fast'), handler(throwError(() => err))))).rejects.toBe(err);
  });

  it('thông điệp lỗi nêu thời hạn', async () => {
    const p = firstValueFrom(interceptor.intercept(ctx(Ctrl, 'fast'), handler(timer(500))));
    const assertion = expect(p).rejects.toThrow(/100/);
    await jest.advanceTimersByTimeAsync(500);
    await assertion;
  });
});
