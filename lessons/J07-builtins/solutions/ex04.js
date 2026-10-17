// ex04 · vnDayRange — đáp án best practice
//
// - Validate định dạng bằng regex VÀ kiểm ngày tồn tại (2026-02-30 → lỗi).
// - `from` = parse chuỗi có offset +07:00 tường minh.
// - `to` = from + 24 giờ. An toàn vì Việt Nam không có giờ mùa hè (ngày luôn dài 24h).
//   Với múi giờ có DST, phải tính "00:00 ngày hôm sau" theo lịch rồi đổi sang UTC (dùng thư viện).
// - Trả khoảng NỬA MỞ [from, to): query `>= from AND < to` không sót mili giây cuối ngày và không
//   đếm trùng 00:00 hôm sau (bài BETWEEN bên SQL).
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

export function vnDayRange(isoDate) {
  if (!ISO_DATE.test(isoDate)) throw new RangeError(`Invalid date: ${isoDate}`);
  const from = new Date(`${isoDate}T00:00:00+07:00`);
  if (Number.isNaN(from.getTime()) || new Date(`${isoDate}T00:00:00Z`).toISOString().slice(0, 10) !== isoDate) {
    throw new RangeError(`Invalid date: ${isoDate}`);
  }
  return { from, to: new Date(from.getTime() + DAY_MS) };
}
