import { bulkDiscount } from './discount';

// Spec này đạt coverage 100% nhưng KHÔNG kiểm gì cả. Hãy sửa nó (ex02).
describe('bulkDiscount', () => {
  it('chạy qua mọi nhánh', () => {
    bulkDiscount(1000, 1);
    bulkDiscount(1000, 10);
    bulkDiscount(1000, 50);
    bulkDiscount(10_000_000, 50);
    try {
      bulkDiscount(-1, 1);
      bulkDiscount(1000, 0);
    } catch {
      // bỏ qua
    }
    expect(true).toBe(true);
  });
});
