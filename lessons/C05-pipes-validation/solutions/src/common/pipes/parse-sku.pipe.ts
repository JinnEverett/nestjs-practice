import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

const SKU_PATTERN = /^[A-Z0-9-]{3,20}$/;

/** Chuẩn hóa SKU (trim + chữ hoa) rồi kiểm định dạng. */
@Injectable()
export class ParseSkuPipe implements PipeTransform<string, string> {
  transform(value: string, metadata?: ArgumentMetadata): string {
    const sku = typeof value === 'string' ? value.trim().toUpperCase() : '';
    if (!SKU_PATTERN.test(sku)) throw new BadRequestException(`${metadata?.data ?? 'sku'} phải khớp ^[A-Z0-9-]{3,20}$`);
    return sku;
  }
}
