import { registerAs } from '@nestjs/config';
import { loadEnv } from './env';

export const pricingConfig = registerAs('pricing', () => {
  const env = loadEnv();
  return { shippingFee: env.SHIPPING_FEE, freeShippingThreshold: env.FREE_SHIPPING_THRESHOLD };
});
