import { INestApplication } from '@nestjs/common';
import { DomainError, DuplicateSkuError, OutOfStockError, ProductNotFoundError } from '../../src/common/errors/domain-errors';
import { createTestApp, http } from './_kit';
import { createProduct, postOrder, stockOf } from './_fixtures';

describe('C06 ex03 · lỗi domain → HTTP', () => {
  describe('lớp lỗi', () => {
    it('là Error, có name, message, code ổn định và extensions', () => {
      const a = new ProductNotFoundError(5);
      const b = new OutOfStockError(7, 5, 2);
      const c = new DuplicateSkuError('AO-1');
      for (const e of [a, b, c]) {
        expect(e).toBeInstanceOf(Error);
        expect(e).toBeInstanceOf(DomainError);
        expect(e.message.length).toBeGreaterThan(0);
      }
      expect([a.name, b.name, c.name]).toEqual(['ProductNotFoundError', 'OutOfStockError', 'DuplicateSkuError']);
      expect([a.code, b.code, c.code]).toEqual(['product-not-found', 'out-of-stock', 'duplicate-sku']);
      expect(a.extensions).toEqual({ productId: 5 });
      expect(b.extensions).toEqual({ productId: 7, requested: 5, available: 2 });
      expect(c.extensions).toEqual({ sku: 'AO-1' });
    });
    it('không phải HttpException (domain không biết HTTP)', () => {
      expect(new OutOfStockError(1, 2, 1)).not.toHaveProperty('getStatus');
    });
  });

  describe('qua HTTP', () => {
    let app: INestApplication;
    beforeAll(async () => {
      app = await createTestApp();
    });
    afterAll(async () => {
      await app.close();
    });

    it('GET sản phẩm không có → 404 product-not-found kèm productId', async () => {
      const res = await http(app).get('/v1/products/4242').expect(404);
      expect(res.body).toMatchObject({ type: 'urn:shop:error:product-not-found', status: 404, productId: 4242, instance: '/v1/products/4242' });
    });

    it('PATCH/DELETE sản phẩm không có → cùng type', async () => {
      expect((await http(app).patch('/v1/products/4243').send({ price: 1 }).expect(404)).body.type).toBe('urn:shop:error:product-not-found');
      expect((await http(app).delete('/v1/products/4244').expect(404)).body.type).toBe('urn:shop:error:product-not-found');
    });

    it('trùng SKU (tạo và đổi) → 409 duplicate-sku kèm sku đã chuẩn hóa', async () => {
      const a = await createProduct(app, { sku: 'dup-9' });
      const b = await createProduct(app);
      const res = await http(app).post('/v1/products').send({ sku: 'DUP-9', name: 'x', price: 1 }).expect(409);
      expect(res.body).toMatchObject({ type: 'urn:shop:error:duplicate-sku', status: 409, sku: 'DUP-9' });
      const res2 = await http(app).patch(`/v1/products/${b.id}`).send({ sku: a.sku }).expect(409);
      expect(res2.body.type).toBe('urn:shop:error:duplicate-sku');
    });

    it('hết hàng → 409 out-of-stock kèm productId, requested, available; kho không đổi', async () => {
      const p = await createProduct(app, { stock: 2 });
      const res = await postOrder(app, { items: [{ productId: p.id, quantity: 5 }] });
      expect(res.status).toBe(409);
      expect(res.headers['content-type']).toMatch(/problem\+json/);
      expect(res.body).toMatchObject({
        type: 'urn:shop:error:out-of-stock', status: 409, productId: p.id, requested: 5, available: 2, instance: '/v1/orders',
      });
      expect(await stockOf(app, p.id)).toBe(2);
    });

    it('xóa sản phẩm đã có đơn → 409 (conflict chung, khác với out-of-stock/duplicate-sku)', async () => {
      const p = await createProduct(app, { stock: 2 });
      await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] });
      const res = await http(app).delete(`/v1/products/${p.id}`).expect(409);
      expect(res.body.type).toBe('urn:shop:error:conflict');
    });
  });
});
