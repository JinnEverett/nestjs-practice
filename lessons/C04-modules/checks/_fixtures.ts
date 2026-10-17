import { INestApplication } from '@nestjs/common';
import { http } from './_kit';

let seq = 0;
/** Tạo sản phẩm qua API; trả về body. Mỗi lần gọi có SKU duy nhất. */
export async function createProduct(app: INestApplication, over: Record<string, unknown> = {}) {
  seq += 1;
  const res = await http(app)
    .post('/v1/products')
    .send({ sku: `SKU-${seq}`, name: `Sản phẩm ${seq}`, price: 100000, ...over });
  if (res.status !== 201) throw new Error(`createProduct → ${res.status} ${JSON.stringify(res.body)}`);
  return res.body as {
    id: number; sku: string; name: string; brand: string | null; price: number; stock: number;
    attributes: Record<string, unknown>; isActive: boolean; categoryId: number; createdAt: string;
  };
}

export async function postOrder(app: INestApplication, body: Record<string, unknown>) {
  return http(app).post('/v1/orders').send(body);
}
export const stockOf = async (app: INestApplication, id: number): Promise<number> =>
  (await http(app).get(`/v1/products/${id}`).expect(200)).body.stock;
