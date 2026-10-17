// ex01 · formatVnd — đáp án best practice
//
// - Intl.NumberFormat biết quy ước của vi-VN (dấu chấm nghìn, ký hiệu ₫ đặt sau, VND 0 chữ số lẻ,
//   tự làm tròn). Không tự ghép chuỗi bằng regex.
// - Tạo formatter MỘT lần ở module scope (khởi tạo Intl khá tốn) rồi dùng lại.
const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function formatVnd(amount) {
  return VND.format(amount);
}
