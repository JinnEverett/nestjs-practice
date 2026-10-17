// ex01 · totalRevenue — đáp án best practice
//
// - Tập trạng thái hợp lệ là hằng số Set có tên → luật nghiệp vụ nằm một chỗ, dễ đổi.
// - filter + reduce đọc như SQL: WHERE status IN (...) → SUM(total).
// - reduce luôn có giá trị khởi tạo 0 → mảng rỗng không ném lỗi.
const REVENUE_STATUSES = new Set(['paid', 'delivered']);

export function totalRevenue(orders) {
  return orders.filter((o) => REVENUE_STATUSES.has(o.status)).reduce((sum, o) => sum + o.total, 0);
}
