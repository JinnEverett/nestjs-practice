import { Test } from '@nestjs/testing';
import { PRICING_RULES, PricingRules } from './pricing.rules';
import { PricingService } from './pricing.service';

const rules: PricingRules = {
  shippingFee: 30_000,
  freeShippingThreshold: 500_000,
  codes: {
    WELCOME10: { type: 'percent', percent: 10, maxDiscount: 100_000, minSubtotal: 200_000 },
    FREESHIP: { type: 'freeship' },
  },
};

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const ref = await Test.createTestingModule({
      providers: [PricingService, { provide: PRICING_RULES, useValue: rules }],
    }).compile();
    service = ref.get(PricingService);
  });

  const line = (unitPrice: number, quantity = 1) => ({ unitPrice, quantity });

  describe('phí ship', () => {
    it('cộng phí ship khi tiền hàng dưới ngưỡng', () => {
      expect(service.quote([line(499_999)])).toEqual({
        subtotal: 499_999, shippingFee: 30_000, discountAmount: 0, totalAmount: 529_999,
      });
    });
    it('miễn phí ship đúng tại ngưỡng', () => {
      expect(service.quote([line(250_000, 2)]).shippingFee).toBe(0);
    });
  });

  describe('mã giảm giá', () => {
    it('WELCOME10 giảm 10% và chuẩn hóa chữ hoa/khoảng trắng', () => {
      const q = service.quote([line(250_000)], ' welcome10 ');
      expect(q.discountAmount).toBe(25_000);
      expect(q.totalAmount).toBe(255_000);
    });
    it('WELCOME10 bị chặn ở mức tối đa', () => {
      expect(service.quote([line(2_000_000)], 'WELCOME10').discountAmount).toBe(100_000);
    });
    it('làm tròn xuống: 333335 → giảm 33333', () => {
      expect(service.quote([line(333_335)], 'WELCOME10').discountAmount).toBe(33_333);
    });
    it('đúng biên đơn tối thiểu được áp dụng, dưới biên 1 đồng thì 422', () => {
      expect(service.quote([line(200_000)], 'WELCOME10').discountAmount).toBe(20_000);
      expect(() => service.quote([line(199_999)], 'WELCOME10')).toThrow(
        expect.objectContaining({ status: 422 }),
      );
    });
    it('FREESHIP bỏ phí ship, không giảm tiền hàng', () => {
      expect(service.quote([line(50_000)], 'FREESHIP')).toEqual({
        subtotal: 50_000, shippingFee: 0, discountAmount: 0, totalAmount: 50_000,
      });
    });
    it('mã không có trong bảng → 422, kể cả tên thuộc tính của Object', () => {
      for (const code of ['NOPE', 'constructor', 'toString']) {
        expect(() => service.quote([line(300_000)], code)).toThrow(expect.objectContaining({ status: 422 }));
      }
    });
    it('null và chuỗi rỗng nghĩa là không dùng mã', () => {
      expect(service.quote([line(100_000)], null).discountAmount).toBe(0);
      expect(service.quote([line(100_000)], '').discountAmount).toBe(0);
    });
  });

  describe('đầu vào sai → 400', () => {
    it.each([
      ['không có dòng nào', []],
      ['quantity = 0', [line(1000, 0)]],
      ['quantity âm', [line(1000, -2)]],
      ['quantity lẻ', [line(1000, 1.5)]],
      ['giá âm', [line(-1)]],
      ['giá lẻ', [line(10.5)]],
    ])('%s', (_name, lines) => {
      expect(() => service.quote(lines)).toThrow(expect.objectContaining({ status: 400 }));
    });
    it('giá 0 là hợp lệ', () => {
      expect(service.quote([line(0)]).subtotal).toBe(0);
    });
  });
});
