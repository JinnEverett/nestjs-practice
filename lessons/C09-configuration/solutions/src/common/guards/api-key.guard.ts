import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';
import { authConfig } from '../../config/auth.config';

const sha256 = (value: string): Buffer => createHash('sha256').update(value).digest();

/** Bảo vệ route ghi bằng header X-Api-Key (tạm thời, A02 thay bằng JWT). Khóa lấy từ config đã được kiểm tra lúc khởi động. */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(@Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>) {}

  canActivate(context: ExecutionContext): boolean {
    const provided = context.switchToHttp().getRequest<Request>().headers['x-api-key'];
    if (typeof provided !== 'string' || !timingSafeEqual(sha256(provided), sha256(this.auth.adminApiKey))) {
      throw new UnauthorizedException('Thiếu hoặc sai X-Api-Key');
    }
    return true;
  }
}
