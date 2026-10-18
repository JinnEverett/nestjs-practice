import { INestApplication } from '@nestjs/common';
import { createTestApp } from './_kit';
import { PricingService } from '../../src/pricing/pricing.service';

describe('C03 ex02 · PricingService', () => {
  let app: INestApplication;
  let pricing: PricingService;
  beforeAll(async () => {
    app = await createTestApp();
    pricing = app.get(PricingService, { strict: false });
  });
  afterAll(async () => {
    await app.close();
  });

  const line = (unitPrice: number, quantity = 1) => ({ unitPrice, quantity });

  it('đơn nhỏ: cộng phí ship 30000', () => {
    expect(pricing.quote([line(100_000, 2)])).toEqual({
      subtotal: 200_000, shippingFee: 30_000, discountAmount: 0, totalAmount: 230_000,
    });
  });

  it('miễn phí ship từ 500000 trở lên (biên 500000 miễn phí, 499999 thì không)', () => {
    expect(pricing.quote([line(500_000)]).shippingFee).toBe(0);
    expect(pricing.quote([line(499_999)]).shippingFee).toBe(30_000);
  });

  it('WELCOME10: -10% tối đa 100000, đơn tối thiểu 200000; chấp nhận chữ thường và khoảng trắng', () => {
    const q = pricing.quote([line(250_000)], ' welcome10 ');
    expect(q).toEqual({ subtotal: 250_000, shippingFee: 30_000, discountAmount: 25_000, totalAmount: 255_000 });
    const big = pricing.quote([line(2_000_000)], 'WELCOME10');
    expect(big.discountAmount).toBe(100_000);
    expect(big.totalAmount).toBe(1_900_000);
  });

  it('WELCOME10 làm tròn xuống thành số nguyên (không có phần lẻ)', () => {
    const q = pricing.quote([line(333_335)], 'WELCOME10');
    expect(q.discountAmount).toBe(33_333);
    expect(Number.isInteger(q.totalAmount)).toBe(true);
  });

  it('WELCOME10 đúng biên 200000 được, 199999 bị từ chối (422)', () => {
    expect(pricing.quote([line(200_000)], 'WELCOME10').discountAmount).toBe(20_000);
    expect(() => pricing.quote([line(199_999)], 'WELCOME10')).toThrow(expect.objectContaining({ status: 422 }));
  });

  it('FREESHIP miễn phí ship, không giảm tiền hàng', () => {
    expect(pricing.quote([line(50_000)], 'FREESHIP')).toEqual({
      subtotal: 50_000, shippingFee: 0, discountAmount: 0, totalAmount: 50_000,
    });
  });

  it('mã lạ → 422; null/rỗng = không dùng mã; mã kiểu "constructor" không lọt qua', () => {
    expect(() => pricing.quote([line(100_000)], 'NOPE')).toThrow(expect.objectContaining({ status: 422 }));
    expect(() => pricing.quote([line(100_000)], 'constructor')).toThrow(expect.objectContaining({ status: 422 }));
    expect(pricing.quote([line(100_000)], null).discountAmount).toBe(0);
    expect(pricing.quote([line(100_000)], '').discountAmount).toBe(0);
  });

  it('đầu vào xấu → 400 (dòng rỗng, quantity <= 0 hoặc lẻ, giá âm hoặc lẻ)', () => {
    for (const lines of [[], [line(1000, 0)], [line(1000, -1)], [line(1000, 1.5)], [line(-1)], [line(10.5)]]) {
      expect(() => pricing.quote(lines)).toThrow(expect.objectContaining({ status: 400 }));
    }
  });
});
