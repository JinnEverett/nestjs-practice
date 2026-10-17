import { INestApplication } from '@nestjs/common';
import { createTestApp, http } from './_kit';
import { createProduct, postOrder } from './_fixtures';

describe('C03 ex06 · vòng phụ thuộc Products ↔ Orders', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp(); // nếu vòng phụ thuộc chưa giải quyết, dòng này đã ném lỗi khi khởi động
  });
  afterAll(async () => {
    await app.close();
  });

  it('xóa sản phẩm chưa từng được đặt → 204', async () => {
    const p = await createProduct(app);
    await http(app).delete(`/v1/products/${p.id}`).expect(204);
  });

  it('xóa sản phẩm đã nằm trong một đơn → 409 và sản phẩm vẫn còn', async () => {
    const p = await createProduct(app, { stock: 3 });
    await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] }).then((r) => expect(r.status).toBe(201));
    await http(app).delete(`/v1/products/${p.id}`).expect(409);
    await http(app).get(`/v1/products/${p.id}`).expect(200);
  });

  it('xóa sản phẩm không tồn tại → 404 (không phải 409)', async () => {
    await http(app).delete('/v1/products/999999').expect(404);
  });
});
