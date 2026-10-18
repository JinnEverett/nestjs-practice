import { Product } from './entities/product.entity';
import { LOW_STOCK_DEFAULT, LOW_STOCK_MAX, selectLowStock } from './low-stock';

const p = (id: number, stock: number, isActive = true): Product => ({
  id, categoryId: 1, sku: `SKU-${id}`, name: `P${id}`, brand: null, price: 1000, stock, attributes: {}, isActive, createdAt: 'x',
});

describe('selectLowStock', () => {
  it('mặc định ngưỡng 5; dùng biên <= (đúng 5 vào, 6 không vào)', () => {
    expect(LOW_STOCK_DEFAULT).toBe(5);
    expect(selectLowStock([p(1, 5), p(2, 6), p(3, 4)]).map((x) => x.id)).toEqual([3, 1]);
  });

  it('ngưỡng tùy chọn, kể cả 0 (chỉ hàng hết)', () => {
    const all = [p(1, 0), p(2, 1), p(3, 10)];
    expect(selectLowStock(all, 0).map((x) => x.id)).toEqual([1]);
    expect(selectLowStock(all, 10).map((x) => x.id)).toEqual([1, 2, 3]);
  });

  it('bỏ sản phẩm ngừng bán dù tồn kho thấp', () => {
    expect(selectLowStock([p(1, 0, false), p(2, 0)]).map((x) => x.id)).toEqual([2]);
  });

  it('sắp xếp ít hàng nhất trước; hòa thì id tăng dần', () => {
    expect(selectLowStock([p(9, 3), p(2, 1), p(5, 3), p(1, 3)]).map((x) => x.id)).toEqual([2, 1, 5, 9]);
  });

  it('không đổi mảng đầu vào và trả bản sao', () => {
    const input = [p(3, 2), p(1, 2)];
    const out = selectLowStock(input);
    expect(input.map((x) => x.id)).toEqual([3, 1]);
    out[0].stock = 999;
    expect(input[1].stock).toBe(2);
    expect(out).not.toBe(input);
  });

  it('danh sách rỗng hoặc không ai thấp → []', () => {
    expect(selectLowStock([])).toEqual([]);
    expect(selectLowStock([p(1, 50)])).toEqual([]);
  });

  it('ngưỡng biên hợp lệ 0 và 1000; ngoài khoảng hoặc không nguyên → RangeError', () => {
    expect(() => selectLowStock([], 0)).not.toThrow();
    expect(() => selectLowStock([], LOW_STOCK_MAX)).not.toThrow();
    for (const bad of [-1, LOW_STOCK_MAX + 1, 1.5, NaN, Infinity]) expect(() => selectLowStock([], bad)).toThrow(RangeError);
  });
});
