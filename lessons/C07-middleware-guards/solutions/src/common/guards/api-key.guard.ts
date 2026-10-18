import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

const sha256 = (value: string): Buffer => createHash('sha256').update(value).digest();

/** Bảo vệ route ghi bằng header X-Api-Key (tạm thời, A02 thay bằng JWT). Khóa lấy từ env ADMIN_API_KEY. */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const provided = request.headers['x-api-key'];
    const expected = process.env.ADMIN_API_KEY ?? (process.env.NODE_ENV === 'production' ? undefined : 'dev-admin-key');
    // Fail closed: production mà quên cấu hình khóa thì từ chối tất cả, không mở toang.
    if (typeof provided !== 'string' || expected === undefined || expected === '') {
      throw new UnauthorizedException('Thiếu hoặc sai X-Api-Key');
    }
    // So sánh thời gian không đổi: băm trước để hai buffer luôn dài bằng nhau (timingSafeEqual ném lỗi nếu khác độ dài).
    if (!timingSafeEqual(sha256(provided), sha256(expected))) throw new UnauthorizedException('Thiếu hoặc sai X-Api-Key');
    return true;
  }
}
