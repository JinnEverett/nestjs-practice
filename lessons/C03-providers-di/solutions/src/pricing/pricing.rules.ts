export const PRICING_RULES = Symbol('PRICING_RULES');

export type DiscountRule =
  | { type: 'percent'; percent: number; maxDiscount: number; minSubtotal: number }
  | { type: 'freeship'; minSubtotal?: number };

export interface PricingRules {
  shippingFee: number;
  freeShippingThreshold: number;
  codes: Record<string, DiscountRule>;
}

export const DEFAULT_PRICING_RULES: PricingRules = {
  shippingFee: 30_000,
  freeShippingThreshold: 500_000,
  codes: {
    WELCOME10: { type: 'percent', percent: 10, maxDiscount: 100_000, minSubtotal: 200_000 },
    FREESHIP: { type: 'freeship' },
  },
};
