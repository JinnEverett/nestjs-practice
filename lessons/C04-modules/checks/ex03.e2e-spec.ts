import { Test } from '@nestjs/testing';
import { PricingModule } from '../../src/pricing/pricing.module';
import { PricingService } from '../../src/pricing/pricing.service';

const q = (service: PricingService, price: number, code?: string) => service.quote([{ unitPrice: price, quantity: 1 }], code);

describe('C04 ex03 · PricingModule.forRoot(options)', () => {
  it('ghi đè từng phần, phần còn lại giữ mặc định', async () => {
    const ref = await Test.createTestingModule({ imports: [PricingModule.forRoot({ shippingFee: 10_000 })] }).compile();
    const service = ref.get(PricingService, { strict: false });
    expect(q(service, 100_000)).toMatchObject({ shippingFee: 10_000, totalAmount: 110_000 });
    expect(q(service, 500_000).shippingFee).toBe(0); // ngưỡng mặc định 500000 còn nguyên
    expect(q(service, 250_000, 'WELCOME10').discountAmount).toBe(25_000); // mã mặc định còn nguyên
    await ref.close();
  });

  it('forRoot({}) = toàn bộ mặc định', async () => {
    const ref = await Test.createTestingModule({ imports: [PricingModule.forRoot({})] }).compile();
    expect(q(ref.get(PricingService, { strict: false }), 100_000).shippingFee).toBe(30_000);
    await ref.close();
  });

  it('thay cả bảng mã', async () => {
    const ref = await Test.createTestingModule({
      imports: [
        PricingModule.forRoot({
          freeShippingThreshold: 50_000,
          codes: { TET: { type: 'percent', percent: 20, maxDiscount: 1_000_000, minSubtotal: 0 } },
        }),
      ],
    }).compile();
    const s = ref.get(PricingService, { strict: false });
    expect(q(s, 100_000, 'tet')).toMatchObject({ discountAmount: 20_000, shippingFee: 0, totalAmount: 80_000 });
    expect(() => q(s, 100_000, 'WELCOME10')).toThrow(expect.objectContaining({ status: 422 }));
    await ref.close();
  });

  it('hai lần forRoot với tùy chọn khác nhau cho hai cấu hình độc lập', async () => {
    const a = await Test.createTestingModule({ imports: [PricingModule.forRoot({ shippingFee: 1 })] }).compile();
    const b = await Test.createTestingModule({ imports: [PricingModule.forRoot({ shippingFee: 2 })] }).compile();
    expect(q(a.get(PricingService, { strict: false }), 1000).shippingFee).toBe(1);
    expect(q(b.get(PricingService, { strict: false }), 1000).shippingFee).toBe(2);
    await Promise.all([a.close(), b.close()]);
  });
});
