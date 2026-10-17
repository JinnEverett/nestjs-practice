// ex09 · formatRelativeVN — đáp án best practice
//
// - Hằng số thời gian có tên; so ngưỡng từ nhỏ đến lớn, return sớm.
// - "Ngày lịch VN" lấy bằng Intl.DateTimeFormat('en-CA', { timeZone }) → 'YYYY-MM-DD' (en-CA cho
//   đúng định dạng ISO). Không dùng getDate() (phụ thuộc TZ máy) hay toISOString() (ngày UTC).
// - "Hôm qua" = ngày VN của (now − 24h) — đúng vì VN không có DST.
// - Formatter tạo một lần ở module scope.
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const TZ = 'Asia/Ho_Chi_Minh';
const vnDayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ });
const vnDisplay = new Intl.DateTimeFormat('vi-VN', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' });

export function formatRelativeVN(date, now = new Date()) {
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return 'vừa xong';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)} phút trước`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)} giờ trước`;
  if (vnDayKey.format(date) === vnDayKey.format(new Date(now.getTime() - DAY))) return 'hôm qua';
  return vnDisplay.format(date);
}
