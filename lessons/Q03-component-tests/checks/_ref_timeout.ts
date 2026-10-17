// @ts-nocheck — bản tham chiếu (cuối Tier C) để sinh mutant; không import trực tiếp.
import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { catchError, Observable, throwError, timeout, TimeoutError } from 'rxjs';

/** @Timeout(ms) đặt giới hạn riêng cho route/controller. Mặc định 5000ms. */
export const Timeout = Reflector.createDecorator<number>();
export const DEFAULT_TIMEOUT_MS = 5_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ms = this.reflector.getAllAndOverride(Timeout, [context.getHandler(), context.getClass()]) ?? DEFAULT_TIMEOUT_MS;
    return next.handle().pipe(
      timeout(ms),
      // Chỉ đổi TimeoutError; lỗi khác (404, 409...) đi qua nguyên vẹn.
      // Lưu ý: rxjs hủy việc chờ, KHÔNG hủy được promise handler đang chạy.
      catchError((err: unknown) =>
        err instanceof TimeoutError ? throwError(() => new RequestTimeoutException(`Xử lý quá ${ms}ms`)) : throwError(() => err),
      ),
    );
  }
}
