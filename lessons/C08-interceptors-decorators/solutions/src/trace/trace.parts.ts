import { CallHandler, CanActivate, ExecutionContext, Injectable, NestInterceptor, NestMiddleware, PipeTransform } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { Observable, tap } from 'rxjs';

/**
 * Pipe không thấy `req`, guard/interceptor/handler thì có. Để cả bốn ghi chung một danh sách theo từng request
 * ta dùng AsyncLocalStorage: mỗi request chạy trong một "ngữ cảnh async" riêng. (P01 dùng đúng kỹ thuật này cho requestId.)
 * KHÔNG dùng mảng ở mức module/singleton: request song song sẽ ghi đè lẫn nhau.
 */
const storage = new AsyncLocalStorage<string[]>();

export function record(event: string): string[] {
  const events = storage.getStore();
  events?.push(event);
  return events ?? [];
}

@Injectable()
export class TraceMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction): void {
    storage.run([], () => {
      record('middleware');
      next();
    });
  }
}

@Injectable()
export class TraceGuard implements CanActivate {
  canActivate(): boolean {
    record('guard');
    return true;
  }
}

@Injectable()
export class TraceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const res = context.switchToHttp().getResponse<Response>();
    record('interceptor:before');
    return next.handle().pipe(
      tap(() => {
        res.setHeader('X-Trace', record('interceptor:after').join(','));
      }),
    );
  }
}

@Injectable()
export class TracePipe implements PipeTransform<string | undefined, number> {
  transform(value: string | undefined): number {
    record('pipe');
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
  }
}
