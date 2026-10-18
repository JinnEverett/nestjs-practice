import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { Observable, of, tap } from 'rxjs';
import { ClockService } from '../../clock/clock.service';

/** @CacheTtl(giây) bật cache cho một route GET. */
export const CacheTtl = Reflector.createDecorator<number>();
export const MAX_CACHE_ENTRIES = 1_000;

interface Entry {
  expiresAt: number;
  body: unknown;
}

/**
 * Cache phản hồi GET trong bộ nhớ. Quy tắc:
 *  - khóa = URL đầy đủ gồm query; chỉ lưu khi handler THÀNH CÔNG (lỗi không được cache);
 *  - bất kỳ request ghi nào thành công (POST/PATCH/DELETE...) xóa sạch cache (đơn hàng cũng đổi tồn kho của sản phẩm);
 *  - có trần số mục (Map giữ thứ tự chèn → bỏ mục cũ nhất) để `?q=ngẫu-nhiên` không làm đầy RAM.
 */
@Injectable()
export class GetCacheInterceptor implements NestInterceptor {
  private readonly entries = new Map<string, Entry>();

  constructor(
    private readonly reflector: Reflector,
    private readonly clock: ClockService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    if (req.method !== 'GET') {
      return next.handle().pipe(tap(() => this.entries.clear()));
    }
    const ttl = this.reflector.getAllAndOverride(CacheTtl, [context.getHandler(), context.getClass()]);
    if (ttl === undefined) return next.handle();

    const key = req.originalUrl;
    const now = this.clock.now().getTime();
    const hit = this.entries.get(key);
    if (hit && hit.expiresAt > now) {
      res.setHeader('X-Cache', 'HIT');
      return of(structuredClone(hit.body)); // bản sao: người nhận sửa body không làm hỏng cache
    }
    res.setHeader('X-Cache', 'MISS');
    return next.handle().pipe(
      tap((body) => {
        this.entries.delete(key);
        this.entries.set(key, { expiresAt: now + ttl * 1000, body: structuredClone(body) });
        if (this.entries.size > MAX_CACHE_ENTRIES) this.entries.delete(this.entries.keys().next().value as string);
      }),
    );
  }
}
