import { Inject, Injectable } from '@nestjs/common';
import { createReadStream, ReadStream } from 'node:fs';
import { mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EXTENSION, ImageType } from './image-magic-bytes.validator';
import { UPLOAD_DIR } from './upload.tokens';

export interface StoredImage {
  productId: number;
  contentType: ImageType;
  size: number;
  etag: string;
  stream(): ReadStream;
}

const TYPE_BY_EXT: Record<string, ImageType> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Mỗi sản phẩm tối đa một ảnh, lưu ở <UPLOAD_DIR>/<productId>.<ext>. Tên file do server đặt, KHÔNG dùng tên client gửi. */
@Injectable()
export class ProductImagesService {
  constructor(@Inject(UPLOAD_DIR) private readonly dir: string) {}

  async save(productId: number, buffer: Buffer, type: ImageType): Promise<StoredImage> {
    await mkdir(this.dir, { recursive: true });
    await this.remove(productId); // thay ảnh: không để lại ảnh cũ (có thể khác đuôi)
    await writeFile(join(this.dir, `${productId}.${EXTENSION[type]}`), buffer);
    return (await this.find(productId))!;
  }

  async find(productId: number): Promise<StoredImage | undefined> {
    for (const [ext, contentType] of Object.entries(TYPE_BY_EXT)) {
      const path = join(this.dir, `${productId}.${ext}`);
      const info = await stat(path).catch(() => undefined);
      if (info?.isFile()) {
        return {
          productId,
          contentType,
          size: info.size,
          etag: `"${info.size}-${Math.floor(info.mtimeMs)}"`,
          stream: () => createReadStream(path),
        };
      }
    }
    return undefined;
  }

  async remove(productId: number): Promise<boolean> {
    let removed = false;
    const names = await readdir(this.dir).catch(() => [] as string[]);
    for (const name of names) {
      if (new RegExp(`^${productId}\\.(jpg|png|webp)$`).test(name)) {
        await rm(join(this.dir, name), { force: true });
        removed = true;
      }
    }
    return removed;
  }
}
