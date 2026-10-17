// ex09 · revenueByCategory — đáp án best practice
//
// - Dựng "index" Map productId → categoryName MỘT lần: O(P). Mỗi dòng hàng tra O(1).
//   Bản dùng products.find() trong vòng lặp là O(dòng hàng × P) = 200k × 10k → hàng tỉ phép so.
// - Gom bằng Map category → { category, revenue, units } trong một lượt duyệt (flatMap qua items).
// - Sắp xếp cuối cùng với tiêu chí phụ để kết quả ổn định.
// Đây chính là "hash join + group by" — bên DB một câu SQL làm việc này nhanh hơn nhiều so với
// kéo hết đơn về app (B04).
const UNKNOWN_CATEGORY = 'Khác';

export function revenueByCategory(orders, products) {
  const categoryOf = new Map(products.map((p) => [p.id, p.categoryName]));
  const totals = new Map();

  for (const item of orders.filter((o) => o.status === 'delivered').flatMap((o) => o.items)) {
    const category = categoryOf.get(item.productId) ?? UNKNOWN_CATEGORY;
    const row = totals.get(category) ?? { category, revenue: 0, units: 0 };
    row.revenue += item.qty * item.unitPrice;
    row.units += item.qty;
    totals.set(category, row);
  }

  return [...totals.values()].toSorted((a, b) => b.revenue - a.revenue || a.category.localeCompare(b.category, 'vi'));
}
