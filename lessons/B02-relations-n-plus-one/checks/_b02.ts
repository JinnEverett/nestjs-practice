// Helper dùng chung cho các check B02 (dựng dữ liệu qua API; đọc/ghi thẳng DB khi cần kiểm trạng thái).
import { INestApplication } from '@nestjs/common';
import { http } from './_kit';
import { dataSourceOf } from './_db';

export const admin = { 'X-Api-Key': process.env.ADMIN_API_KEY ?? 'dev-admin-key' };

let seq = 0;
const uniq = (): string => `${Date.now().toString(36)}${(++seq).toString(36)}`;

export async function makeCategory(app: INestApplication, over: Record<string, unknown> = {}): Promise<{ id: number; slug: string; parentId: number | null; name: string }> {
  const slug = `c-${uniq()}`;
  const res = await http(app).post('/v1/categories').set(admin).send({ name: `Danh mục ${slug}`, slug, ...over });
  if (res.status !== 201) throw new Error(`makeCategory: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export async function makeProduct(app: INestApplication, over: Record<string, unknown> = {}): Promise<{ id: number; sku: string; categoryId: number }> {
  const sku = `P-${uniq()}`.toUpperCase().slice(0, 20);
  const res = await http(app).post('/v1/products').set(admin).send({ sku, name: `SP ${sku}`, price: 100000, ...over });
  if (res.status !== 201) throw new Error(`makeProduct: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body;
}

export async function one<T = Record<string, unknown>>(app: INestApplication, sql: string, params: unknown[] = []): Promise<T> {
  const rows = (await dataSourceOf(app).query(sql, params)) as T[];
  return rows[0];
}
