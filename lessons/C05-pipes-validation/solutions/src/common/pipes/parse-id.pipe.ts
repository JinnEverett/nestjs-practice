import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Số nguyên dương an toàn. ParseIntPipe có sẵn chấp nhận cả 0, số âm và số vượt 2^53.
 * Lưu ý: ValidationPipe toàn cục (transform: true) chạy TRƯỚC pipe của param và đã đổi '12' → 12
 * theo kiểu khai báo `id: number`, nên pipe này nhận được cả string lẫn number.
 */
@Injectable()
export class ParseIdPipe implements PipeTransform<string | number, number> {
  transform(value: string | number, metadata: ArgumentMetadata): number {
    const name = metadata.data ?? 'id';
    const n = typeof value === 'number' ? value : typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : NaN;
    if (!Number.isSafeInteger(n) || n < 1) throw new BadRequestException(`${name} phải là số nguyên dương`);
    return n;
  }
}
