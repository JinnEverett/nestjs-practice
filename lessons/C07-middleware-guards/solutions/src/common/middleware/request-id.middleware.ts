import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';
/** Chỉ nhận id do client gửi nếu nó "sạch": ngắn, không ký tự điều khiển/khoảng trắng (chống làm giả log, header injection). */
const SAFE_ID = /^[A-Za-z0-9._-]{8,64}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers[REQUEST_ID_HEADER];
    const id = typeof incoming === 'string' && SAFE_ID.test(incoming) ? incoming : randomUUID();
    req.headers[REQUEST_ID_HEADER] = id; // các lớp sau (logger, guard, @ReqId() ở C08) đọc từ đây
    res.setHeader('X-Request-Id', id);
    next();
  }
}
