import { INestApplication } from '@nestjs/common';
import { createTestApp } from './_kit';
import { createProduct, postOrder, stockOf } from './_fixtures';

describe('C05 ex03 · DTO lồng nhau cho đơn hàng', () => {
  let app: INestApplication;
  let pid: number;
  beforeAll(async () => {
    app = await createTestApp();
    pid = (await createProduct(app, { stock: 1000, price: 10_000 })).id;
  });
  afterAll(async () => {
    await app.close();
  });

  const bad = async (body: unknown, mention: string) => {
    const res = await postOrder(app, body as Record<string, unknown>);
    expect(res.status).toBe(400);
    expect((res.body.message as string[]).join(' | ')).toContain(mention);
  };

  it('đơn hợp lệ → 201', async () => {
    const res = await postOrder(app, { items: [{ productId: pid, quantity: 2 }], discountCode: 'freeship' });
    expect(res.status).toBe(201);
    expect(res.body.discountCode).toBe('FREESHIP');
  });

  it('lỗi ở phần tử mảng nêu đường dẫn: items.1.quantity', async () => {
    await bad({ items: [{ productId: pid, quantity: 1 }, { productId: pid, quantity: 0 }] }, 'items.1.quantity');
  });

  it('productId sai kiểu/giá trị', async () => {
    await bad({ items: [{ productId: '1', quantity: 1 }] }, 'items.0.productId');
    await bad({ items: [{ productId: 0, quantity: 1 }] }, 'items.0.productId');
    await bad({ items: [{ productId: 1.5, quantity: 1 }] }, 'items.0.productId');
  });

  it('quantity tối đa 100 mỗi dòng', async () => {
    await bad({ items: [{ productId: pid, quantity: 101 }] }, 'items.0.quantity');
    expect((await postOrder(app, { items: [{ productId: pid, quantity: 100 }] })).status).toBe(201);
  });

  it('items: thiếu / rỗng / không phải mảng / quá 50 dòng', async () => {
    await bad({}, 'items');
    await bad({ items: [] }, 'items');
    await bad({ items: 'x' }, 'items');
    await bad({ items: Array.from({ length: 51 }, () => ({ productId: pid, quantity: 1 })) }, 'items');
  });

  it('phần tử không phải object → 400', async () => {
    await bad({ items: [5] }, 'items');
    await bad({ items: [null] }, 'items');
  });

  it('field lạ ở trong dòng hàng (unitPrice) bị từ chối', async () => {
    await bad({ items: [{ productId: pid, quantity: 1, unitPrice: 1 }] }, 'unitPrice');
  });

  it('discountCode: định dạng sai hoặc rỗng → 400; mã đúng định dạng nhưng không tồn tại → 422 (service)', async () => {
    await bad({ items: [{ productId: pid, quantity: 1 }], discountCode: 'a b!' }, 'discountCode');
    await bad({ items: [{ productId: pid, quantity: 1 }], discountCode: '' }, 'discountCode');
    await bad({ items: [{ productId: pid, quantity: 1 }], discountCode: 5 }, 'discountCode');
    expect((await postOrder(app, { items: [{ productId: pid, quantity: 1 }], discountCode: 'NOPE' })).status).toBe(422);
    expect((await postOrder(app, { items: [{ productId: pid, quantity: 1 }], discountCode: null })).status).toBe(201);
  });

  it('đơn bị 400 không để lại dấu vết: tồn kho giữ nguyên', async () => {
    const before = await stockOf(app, pid);
    await postOrder(app, { items: [{ productId: pid, quantity: 1 }, { productId: pid, quantity: -1 }] });
    expect(await stockOf(app, pid)).toBe(before);
  });
});
