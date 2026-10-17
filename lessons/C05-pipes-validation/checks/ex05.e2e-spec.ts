import { BadRequestException } from '@nestjs/common';
import { INestApplication } from '@nestjs/common';
import { ParseIdPipe } from '../../src/common/pipes/parse-id.pipe';
import { ParseSkuPipe } from '../../src/common/pipes/parse-sku.pipe';
import { createTestApp, http } from './_kit';
import { createProduct, postOrder } from './_fixtures';

describe('C05 ex05 · pipe tự viết: ParseIdPipe, ParseSkuPipe', () => {
  describe('đơn vị', () => {
    const idPipe = new ParseIdPipe();
    const skuPipe = new ParseSkuPipe();
    const meta = { type: 'param' as const, data: 'id' };

    it('ParseIdPipe: số nguyên dương → number', () => {
      expect(idPipe.transform('42', meta)).toBe(42);
    });
    it.each(['0', '-1', '1.5', 'abc', '', ' 1', '1 ', '1e3', '0x10', '007', '9007199254740993', '+1'])(
      'ParseIdPipe từ chối %j',
      (v) => {
        expect(() => idPipe.transform(v, meta)).toThrow(BadRequestException);
      },
    );
    it('ParseIdPipe: thông báo lỗi nêu tên tham số', () => {
      expect(() => idPipe.transform('x', { type: 'param', data: 'orderId' })).toThrow(/orderId/);
    });
    it('ParseSkuPipe: trim + chữ hoa', () => {
      expect(skuPipe.transform('  ao-1 ', { type: 'param', data: 'sku' })).toBe('AO-1');
    });
    it.each(['', 'ab', 'a b', 'x'.repeat(21), 'có-dấu'])('ParseSkuPipe từ chối %j', (v) => {
      expect(() => skuPipe.transform(v, { type: 'param', data: 'sku' })).toThrow(BadRequestException);
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

    it.each(['/v1/products/0', '/v1/products/-5', '/v1/products/1.5', '/v1/products/abc', '/v1/products/9007199254740993', '/v1/orders/0', '/v1/orders/-1'])(
      '%s → 400',
      async (url) => {
        const res = await http(app).get(url).expect(400);
        expect((res.body.message as string).toString()).toContain('id');
      },
    );

    it('id hợp lệ nhưng không tồn tại → 404 (không lẫn với 400)', async () => {
      await http(app).get('/v1/products/999999').expect(404);
      await http(app).get('/v1/orders/999999').expect(404);
      await http(app).patch('/v1/products/0').send({ price: 1 }).expect(400);
      await http(app).delete('/v1/products/-1').expect(400);
    });

    it('/v1/p/:sku dùng ParseSkuPipe: sku sai định dạng → 400; đúng nhưng không có → 404; có → 302', async () => {
      await http(app).get('/v1/p/a').redirects(0).expect(400);
      await http(app).get('/v1/p/KHONG-CO').redirects(0).expect(404);
      const p = await createProduct(app, { sku: 'GO-1' });
      const res = await http(app).get('/v1/p/%20go-1%20').redirects(0).expect(302);
      expect(res.headers.location).toBe(`/v1/products/${p.id}`);
    });

    it('đường đi đơn hàng vẫn đúng với id hợp lệ', async () => {
      const p = await createProduct(app, { stock: 5 });
      const o = await postOrder(app, { items: [{ productId: p.id, quantity: 1 }] });
      await http(app).get(`/v1/orders/${o.body.id}`).expect(200);
    });
  });
});
