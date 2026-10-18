import { bulkDiscount, MAX_DISCOUNT, TIERS } from './discount';

describe('bulkDiscount', () => {
  it('khai báo bậc cao trước (find lấy bậc đầu tiên khớp)', () => {
    expect(TIERS.map((t) => t.minQty)).toEqual([50, 10]);
    expect(MAX_DISCOUNT).toBe(20_000);
  });

  it.each([[1, 0], [9, 0], [10, 500], [49, 2450], [50, 5000]])('đơn giá 1000 × %i → giảm %i', (qty, expected) => {
    expect(bulkDiscount(1000, qty)).toBe(expected);
  });

  it('bậc 5% bắt đầu đúng ở 10, bậc 10% đúng ở 50 (biên)', () => {
    expect(bulkDiscount(100, 9)).toBe(0);
    expect(bulkDiscount(100, 10)).toBe(50);
    expect(bulkDiscount(100, 49)).toBe(245);
    expect(bulkDiscount(100, 50)).toBe(500);
  });

  it('làm tròn xuống thành số nguyên', () => {
    expect(bulkDiscount(333, 10)).toBe(166); // 3330 × 5% = 166.5
    expect(bulkDiscount(1, 50)).toBe(5);
  });

  it('có trần 20000 và đúng trần khi vừa chạm', () => {
    expect(bulkDiscount(10_000_000, 50)).toBe(20_000);
    expect(bulkDiscount(40_000, 10)).toBe(20_000); // 400000 × 5% = 20000
    expect(bulkDiscount(40_002, 10)).toBe(20_000); // 20001 → bị chặn
    expect(bulkDiscount(39_998, 10)).toBe(19_999);
  });

  it('đơn giá 0 → 0', () => {
    expect(bulkDiscount(0, 100)).toBe(0);
  });

  it.each([[-1, 1], [1.5, 1], [NaN, 1], [100, 0], [100, -3], [100, 2.5], [100, NaN]])('đầu vào sai (%p, %p) → RangeError', (price, qty) => {
    expect(() => bulkDiscount(price, qty)).toThrow(RangeError);
  });
});
