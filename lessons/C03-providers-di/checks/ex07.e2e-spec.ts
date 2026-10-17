import { INestApplication } from '@nestjs/common';
import { createTestApp } from './_kit';
import { createProduct, postOrder, stockOf } from './_fixtures';

describe('C03 ex07 · 🔴 đơn hai dòng, dòng sau hết hàng', () => {
  let app: INestApplication;
  beforeAll(async () => {
    app = await createTestApp();
  });
  afterAll(async () => {
    await app.close();
  });

  it('đơn bị từ chối thì KHÔNG dòng nào bị trừ kho (hết hàng ở dòng sau)', async () => {
    const a = await createProduct(app, { stock: 10 });
    const b = await createProduct(app, { stock: 1 });
    const res = await postOrder(app, { items: [{ productId: a.id, quantity: 4 }, { productId: b.id, quantity: 2 }] });
    expect(res.status).toBe(409);
    expect(await stockOf(app, a.id)).toBe(10);
    expect(await stockOf(app, b.id)).toBe(1);
  });

  it('đơn bị từ chối vì dòng sau không tồn tại/ngừng bán → kho dòng đầu giữ nguyên', async () => {
    const a = await createProduct(app, { stock: 10 });
    const off = await createProduct(app, { stock: 10, isActive: false });
    for (const second of [999_999, off.id]) {
      const res = await postOrder(app, { items: [{ productId: a.id, quantity: 4 }, { productId: second, quantity: 1 }] });
      expect(res.status).toBe(422);
    }
    expect(await stockOf(app, a.id)).toBe(10);
  });

  it('đơn bị từ chối vì mã giảm giá sai → kho giữ nguyên', async () => {
    const a = await createProduct(app, { stock: 10, price: 50_000 });
    const res = await postOrder(app, { items: [{ productId: a.id, quantity: 2 }], discountCode: 'WELCOME10' });
    expect(res.status).toBe(422); // 100000 < 200000
    expect(await stockOf(app, a.id)).toBe(10);
  });

  it('đơn thành công trừ đúng từng dòng; sau đó đặt vừa hết tồn kho vẫn được, đặt thêm 1 thì 409', async () => {
    const a = await createProduct(app, { stock: 3 });
    const b = await createProduct(app, { stock: 2 });
    expect((await postOrder(app, { items: [{ productId: a.id, quantity: 3 }, { productId: b.id, quantity: 1 }] })).status).toBe(201);
    expect(await stockOf(app, a.id)).toBe(0);
    expect(await stockOf(app, b.id)).toBe(1);
    expect((await postOrder(app, { items: [{ productId: a.id, quantity: 1 }] })).status).toBe(409);
  });
});
