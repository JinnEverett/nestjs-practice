import { Module } from '@nestjs/common';
import { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, PricingModuleOptions } from './pricing.module-definition';
import { DEFAULT_PRICING_RULES, PRICING_RULES } from './pricing.rules';
import { PricingService } from './pricing.service';

@Module({
  providers: [
    PricingService,
    {
      provide: PRICING_RULES,
      useFactory: (options: PricingModuleOptions) => ({ ...DEFAULT_PRICING_RULES, ...options }),
      inject: [MODULE_OPTIONS_TOKEN],
    },
  ],
  exports: [PricingService],
})
export class PricingModule extends ConfigurableModuleClass {}
