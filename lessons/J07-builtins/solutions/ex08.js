// ex08 · parseJsonWithDates — đáp án best practice
//
// - Dùng tham số `reviver` của JSON.parse: được gọi cho MỌI giá trị ở mọi độ sâu → không cần tự đệ quy.
// - Regex ISO chặt (ngày + 'T' + giờ + Z|±HH:MM) để không biến nhầm chuỗi thường thành Date.
// - Kiểm thêm `!Number.isNaN(date)` vì regex không biết tháng 13 hay giờ 99 là sai.
// - Lỗi cú pháp JSON vẫn ném SyntaxError như JSON.parse gốc.
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

export function parseJsonWithDates(text) {
  return JSON.parse(text, (_key, value) => {
    if (typeof value !== 'string' || !ISO_DATETIME.test(value)) return value;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date;
  });
}
