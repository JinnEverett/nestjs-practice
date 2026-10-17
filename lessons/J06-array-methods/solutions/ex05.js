// ex05 · topCustomers — đáp án best practice
//
// - Bước 1 (GROUP BY): reduce vào Map customerId → { customerId, revenue, orderCount }.
//   Map giữ key số đúng kiểu (object thường sẽ biến key thành chuỗi).
// - Bước 2 (ORDER BY ... LIMIT): toSorted với tiêu chí phụ, rồi slice(0, n).
// - Không mutate orders; Map.values() → mảng bằng spread.
export function topCustomers(orders, n = 3) {
  const stats = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((acc, { customerId, total }) => {
      const s = acc.get(customerId) ?? { customerId, revenue: 0, orderCount: 0 };
      s.revenue += total;
      s.orderCount += 1;
      return acc.set(customerId, s);
    }, new Map());

  return [...stats.values()].toSorted((a, b) => b.revenue - a.revenue || a.customerId - b.customerId).slice(0, n);
}
