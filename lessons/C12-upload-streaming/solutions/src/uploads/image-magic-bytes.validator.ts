import { FileValidator } from '@nestjs/common';

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/** Nhận dạng ảnh theo NỘI DUNG (magic bytes), bỏ qua Content-Type và đuôi file do client khai (giả mạo được dễ dàng). */
export function detectImageType(buffer: Buffer): ImageType | undefined {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.length >= 8 && PNG.every((b, i) => buffer[i] === b)) return 'image/png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return undefined;
}

export const EXTENSION: Record<ImageType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export class ImageMagicBytesValidator extends FileValidator<Record<string, never>, Express.Multer.File> {
  constructor() {
    super({});
  }

  isValid(file?: Express.Multer.File): boolean {
    return Boolean(file?.buffer) && detectImageType(file!.buffer) !== undefined;
  }

  buildErrorMessage(): string {
    return 'Chỉ nhận ảnh JPEG, PNG hoặc WebP (kiểm theo nội dung file)';
  }
}
