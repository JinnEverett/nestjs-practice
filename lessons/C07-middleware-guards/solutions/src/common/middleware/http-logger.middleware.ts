import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { REQUEST_ID_HEADER } from './request-id.middleware';

const logger = new Logger('HTTP');

/** Một dòng log mỗi request, ghi lúc response xong. Không ghi query string và không ghi header nhạy cảm. */
export function httpLogger(req: Request, res: Response, next: NextFunction): void {
  const started = process.hrtime.bigint();
  const requestId = String(req.headers[REQUEST_ID_HEADER] ?? '-');
  const path = req.originalUrl.split('?')[0];
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const line = `${req.method} ${path} ${res.statusCode} ${ms.toFixed(1)}ms requestId=${requestId}`;
    if (res.statusCode >= 500) logger.error(line);
    else if (res.statusCode >= 400) logger.warn(line);
    else logger.log(line);
  });
  next();
}
