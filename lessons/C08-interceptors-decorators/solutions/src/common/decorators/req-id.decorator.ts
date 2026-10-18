import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Lấy id của request do RequestIdMiddleware đặt (C07). Dùng: handler(@ReqId() requestId: string). */
export const ReqId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string | undefined => {
  const header = ctx.switchToHttp().getRequest<Request>().headers['x-request-id'];
  return typeof header === 'string' ? header : undefined;
});
