import type { NextFunction, Request, Response } from 'express';

/** Dữ liệu đơn hàng là của riêng người dùng: cấm cache ở proxy/trình duyệt. */
export function noStore(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('Cache-Control', 'no-store');
  next();
}
