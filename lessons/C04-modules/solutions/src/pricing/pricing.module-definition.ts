import { ConfigurableModuleBuilder } from '@nestjs/common';
import { PricingRules } from './pricing.rules';

/** Mọi trường đều tùy chọn: thiếu thì dùng DEFAULT_PRICING_RULES (trộn nông). */
export type PricingModuleOptions = Partial<PricingRules>;

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<PricingModuleOptions>()
  .setClassMethodName('forRoot') // sinh forRoot() và forRootAsync()
  .setFactoryMethodName('createPricingOptions') // tên method cho useClass/useExisting
  .setExtras({ isGlobal: false }, (definition, extras) => ({ ...definition, global: extras.isGlobal }))
  .build();
