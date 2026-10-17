export interface Tier {
  minQty: number;
  percent: number;
}

/** Từ cao xuống thấp: find() lấy bậc đầu tiên khớp. */
export const TIERS: Tier[] = [
  { minQty: 50, percent: 10 },
  { minQty: 10, percent: 5 },
];
export const MAX_DISCOUNT = 20_000;

/** Giảm giá theo số lượng: >= 50 giảm 10%, >= 10 giảm 5%, tối đa 20000 VND; làm tròn xuống. */
export function bulkDiscount(unitPrice: number, quantity: number): number {
  if (!Number.isInteger(unitPrice) || unitPrice < 0 || !Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError('unitPrice phải là số nguyên >= 0 và quantity số nguyên >= 1');
  }
  const tier = TIERS.find((t) => quantity >= t.minQty);
  if (!tier) return 0;
  return Math.min(Math.floor((unitPrice * quantity * tier.percent) / 100), MAX_DISCOUNT);
}
