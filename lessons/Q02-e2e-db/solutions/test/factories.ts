import { INestApplication } from '@nestjs/common';
import request from 'supertest';

let seq = 0;
const RUN = Date.now().toString(36).slice(-4).toUpperCase();

/** Thân hợp lệ cho POST /v1/products. SKU duy nhất trong tiến trình và gần như duy nhất giữa các lần chạy, luôn khớp ^[A-Z0-9-]{3,20}$. */
export function makeProduct(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  seq += 1;
  return { sku: `T${RUN}-${seq.toString(36).toUpperCase()}`, name: `Sản phẩm thử ${seq}`, price: 100_000, stock: 10, ...overrides };
}

export interface CreatedProduct {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  [key: string]: unknown;
}

/** Tạo sản phẩm qua API (có khóa admin) và trả về body; ném lỗi rõ ràng nếu không phải 201. */
export async function createProduct(app: INestApplication, overrides: Record<string, unknown> = {}): Promise<CreatedProduct> {
  const res = await request(app.getHttpServer())
    .post('/v1/products')
    .set('x-api-key', process.env.ADMIN_API_KEY ?? 'dev-admin-key')
    .send(makeProduct(overrides));
  if (res.status !== 201) throw new Error(`createProduct → ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as CreatedProduct;
}
