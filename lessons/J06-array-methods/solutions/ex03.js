// ex03 · countByStatus — đáp án best practice
//
// - Khởi tạo accumulator bằng các status liệt kê sẵn với giá trị 0 (Object.fromEntries + map).
// - reduce cộng dồn; `(acc[s] ?? 0) + 1` xử lý status chưa có.
// - Lưu ý: accumulator là object thường nên status 'toString' đọc acc['toString'] ra HÀM kế thừa
//   → `?? 0` không cứu được. Dùng Object.hasOwn để chắc chắn (hoặc dùng Map rồi Object.fromEntries).
export function countByStatus(orders, statuses = []) {
  const initial = Object.fromEntries(statuses.map((s) => [s, 0]));
  return orders.reduce((acc, { status }) => {
    acc[status] = (Object.hasOwn(acc, status) ? acc[status] : 0) + 1;
    return acc;
  }, initial);
}
