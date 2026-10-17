// ex07 · Product helpers — đáp án best practice
//
// - `??` thay cho `||`: salePrice = 0 là giá hợp lệ.
// - findCheapest dùng reduce KHÔNG có giá trị khởi tạo nhưng chỉ sau khi đã chắc mảng không rỗng —
//   hoặc như dưới đây: reduce với khởi tạo `undefined` và kiểu tường minh → không cần `!`.
// - averagePrice trả `null` cho mảng rỗng: kiểu trả về `number | null` buộc caller xử lý trường hợp này.
// - `readonly Product[]` → hàm không sửa input.
export interface Product {
  id: number;
  name: string;
  price: number;
  salePrice?: number;
}

export function effectivePrice(p: Product): number {
  return p.salePrice ?? p.price;
}

export function findCheapest(products: readonly Product[]): Product | undefined {
  return products.reduce<Product | undefined>((best, p) => (best === undefined || effectivePrice(p) < effectivePrice(best) ? p : best), undefined);
}

export function averagePrice(products: readonly Product[]): number | null {
  if (products.length === 0) return null;
  return Math.round(products.reduce((sum, p) => sum + effectivePrice(p), 0) / products.length);
}
