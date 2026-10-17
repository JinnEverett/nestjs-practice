import { Module } from '@nestjs/common';
import { DEFAULT_PRICING_RULES, PRICING_RULES } from './pricing.rules';
import { PricingService } from './pricing.service';

@Module({
  providers: [PricingService, { provide: PRICING_RULES, useValue: DEFAULT_PRICING_RULES }],
  exports: [PricingService],
})
export class PricingModule {}
