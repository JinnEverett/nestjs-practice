// @ts-nocheck — bản tham chiếu để sinh mutant; không import trực tiếp.
import { Product } from './entities/product.entity';

export const LOW_STOCK_DEFAULT = 5;
export const LOW_STOCK_MAX = 1000;

/** Sản phẩm đang bán có tồn kho <= threshold, ít hàng nhất trước (hòa thì id nhỏ trước). Không đổi đầu vào, trả bản sao. */
export function selectLowStock(products: readonly Product[], threshold: number = LOW_STOCK_DEFAULT): Product[] {
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > LOW_STOCK_MAX) {
    throw new RangeError(`threshold phải là số nguyên 0..${LOW_STOCK_MAX}`);
  }
  return products
    .filter((p) => p.isActive && p.stock <= threshold)
    .sort((a, b) => a.stock - b.stock || a.id - b.id)
    .map((p) => ({ ...p }));
}
