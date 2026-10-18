import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PricingModule } from '../../src/pricing/pricing.module';
import { PricingService } from '../../src/pricing/pricing.service';

@Injectable()
class NeedsPricing {
  constructor(readonly pricing: PricingService) {}
}
@Module({ providers: [NeedsPricing] })
class Feature {}

describe('C04 ex06 · tùy chọn isGlobal của dynamic module', () => {
  it('isGlobal: true → module khác dùng PricingService không cần import', async () => {
    const ref = await Test.createTestingModule({
      imports: [PricingModule.forRoot({ shippingFee: 5, isGlobal: true }), Feature],
    }).compile();
    const consumer = ref.get(NeedsPricing, { strict: false });
    expect(consumer.pricing.quote([{ unitPrice: 1000, quantity: 1 }]).shippingFee).toBe(5);
    await ref.close();
  });

  it('mặc định không global → module khác không thấy PricingService', async () => {
    await expect(
      Test.createTestingModule({ imports: [PricingModule.forRoot({ shippingFee: 5 }), Feature] }).compile(),
    ).rejects.toThrow(/resolve dependencies/i);
  });

  it('isGlobal không lọt vào bảng giá (không ảnh hưởng tính tiền)', async () => {
    const ref = await Test.createTestingModule({ imports: [PricingModule.forRoot({ isGlobal: true })] }).compile();
    expect(ref.get(PricingService, { strict: false }).quote([{ unitPrice: 100_000, quantity: 1 }])).toMatchObject({
      shippingFee: 30_000, totalAmount: 130_000,
    });
    await ref.close();
  });

  it('forRootAsync cũng nhận isGlobal', async () => {
    const ref = await Test.createTestingModule({
      imports: [PricingModule.forRootAsync({ isGlobal: true, useFactory: () => ({}) }), Feature],
    }).compile();
    expect(ref.get(NeedsPricing, { strict: false }).pricing).toBeInstanceOf(PricingService);
    await ref.close();
  });
});
