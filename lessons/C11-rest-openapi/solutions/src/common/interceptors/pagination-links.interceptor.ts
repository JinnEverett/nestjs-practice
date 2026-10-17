import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap } from 'rxjs';

interface Paginated {
  meta: { page: number; limit: number; total: number };
}

const isPaginated = (body: unknown): body is Paginated => {
  const meta = (body as Paginated | null)?.meta;
  return typeof meta === 'object' && meta !== null && Number.isInteger(meta.page) && Number.isInteger(meta.limit) && Number.isInteger(meta.total);
};

/**
 * Thêm header `Link` (RFC 8288) first/prev/next/last cho phản hồi danh sách { data, meta }.
 * Đăng ký NGOÀI interceptor cache: header suy ra từ body phải có cả khi body lấy từ cache.
 */
@Injectable()
export class PaginationLinksInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    if (req.method !== 'GET') return next.handle();
    return next.handle().pipe(
      tap((body) => {
        if (!isPaginated(body) || res.headersSent) return;
        const { page, limit, total } = body.meta;
        const last = Math.max(1, Math.ceil(total / limit));
        const [path, query = ''] = req.originalUrl.split('?');
        const link = (p: number, rel: string) => {
          const params = new URLSearchParams(query);
          params.set('page', String(p));
          params.set('limit', String(limit));
          return `<${path}?${params.toString()}>; rel="${rel}"`;
        };
        const links = [link(1, 'first')];
        if (page > 1) links.push(link(Math.min(page - 1, last), 'prev'));
        if (page < last) links.push(link(page + 1, 'next'));
        links.push(link(last, 'last'));
        res.setHeader('Link', links.join(', '));
      }),
    );
  }
}
