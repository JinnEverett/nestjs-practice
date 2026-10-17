import { Injectable, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PricingModule } from '../../src/pricing/pricing.module';
import { PricingService } from '../../src/pricing/pricing.service';

const FEE = Symbol('FEE');
@Module({ providers: [{ provide: FEE, useValue: 12_345 }], exports: [FEE] })
class FeeModule {}

@Injectable()
class FeeOptionsFactory {
  createPricingOptions() {
    return { shippingFee: 7_777 };
  }
}

const ship = (s: PricingService) => s.quote([{ unitPrice: 1000, quantity: 1 }]).shippingFee;

describe('C04 ex04 · PricingModule.forRootAsync + ConfigurableModuleBuilder', () => {
  it('useFactory (async)', async () => {
    const ref = await Test.createTestingModule({
      imports: [PricingModule.forRootAsync({ useFactory: async () => ({ shippingFee: 20_000 }) })],
    }).compile();
    expect(ship(ref.get(PricingService, { strict: false }))).toBe(20_000);
    await ref.close();
  });

  it('useFactory + imports + inject lấy giá trị từ module khác', async () => {
    const ref = await Test.createTestingModule({
      imports: [
        PricingModule.forRootAsync({ imports: [FeeModule], inject: [FEE], useFactory: (fee: number) => ({ shippingFee: fee }) }),
      ],
    }).compile();
    expect(ship(ref.get(PricingService, { strict: false }))).toBe(12_345);
    await ref.close();
  });

  it('useClass với method createPricingOptions()', async () => {
    const ref = await Test.createTestingModule({
      imports: [PricingModule.forRootAsync({ useClass: FeeOptionsFactory })],
    }).compile();
    expect(ship(ref.get(PricingService, { strict: false }))).toBe(7_777);
    await ref.close();
  });

  it('forRootAsync cũng trộn với mặc định (ngưỡng miễn ship còn nguyên)', async () => {
    const ref = await Test.createTestingModule({
      imports: [PricingModule.forRootAsync({ useFactory: () => ({ shippingFee: 1 }) })],
    }).compile();
    expect(ref.get(PricingService, { strict: false }).quote([{ unitPrice: 500_000, quantity: 1 }]).shippingFee).toBe(0);
    await ref.close();
  });
});
