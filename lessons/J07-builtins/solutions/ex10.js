// ex10 · dailyReport — đáp án best practice
//
// - Khóa nhóm = ngày lịch VN qua Intl (timeZone tường minh) → đúng trên mọi server.
//   Bug kinh điển: createdAt.slice(0, 10) hoặc toISOString().slice(0, 10) → ngày UTC → đơn 0h–7h sáng
//   bị tính sang hôm trước.
// - Gom bằng Map, rồi sắp theo chuỗi 'YYYY-MM-DD' (so chuỗi ISO = so thời gian).
// Bên SQL: GROUP BY date_trunc('day', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh') — làm ở DB khi dữ liệu lớn.
const vnDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });

export function dailyReport(orders) {
  const days = new Map();
  for (const { createdAt, total } of orders) {
    const date = vnDay.format(new Date(createdAt));
    const row = days.get(date) ?? { date, count: 0, revenue: 0 };
    row.count += 1;
    row.revenue += total;
    days.set(date, row);
  }
  return [...days.values()].toSorted((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
