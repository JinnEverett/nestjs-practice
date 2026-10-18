import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Response } from 'express';
import { Observable, tap } from 'rxjs';

/** Đo thời gian chạy của handler (pipe + handler + interceptor bên trong) và báo qua header Server-Timing. */
@Injectable()
export class TimingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<Response>();
    const started = process.hrtime.bigint();
    return next.handle().pipe(
      tap(() => {
        const ms = Number(process.hrtime.bigint() - started) / 1e6;
        if (!res.headersSent) res.setHeader('Server-Timing', `app;dur=${ms.toFixed(1)}`);
      }),
    );
  }
}
