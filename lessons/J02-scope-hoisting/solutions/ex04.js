// ex04 · calculateTotal — đáp án best practice
//
// Bug gốc: `total` chưa khai báo (strict mode → ReferenceError; sloppy mode → biến toàn cục
// cộng dồn giữa các lần gọi), `discount` là undefined khi không vào if → NaN.
//
// - `reduce` với giá trị đầu 0: không cần biến đếm, mảng rỗng tự ra 0.
// - Mọi biến là `const`, sống trong hàm → không rò ra ngoài, không cộng dồn giữa các lần gọi.
// - Ngưỡng và tỉ lệ là hằng số có tên → đọc là hiểu luật nghiệp vụ, dễ đổi.
// - Tiền VND là số nguyên → Math.round sau khi nhân tỉ lệ.
const DISCOUNT_THRESHOLD = 1_000_000;
const DISCOUNT_RATE = 0.1;

export function calculateTotal(items) {
  const subtotal = items.reduce((sum, { price, qty }) => sum + price * qty, 0);
  if (subtotal < DISCOUNT_THRESHOLD) return subtotal;
  return Math.round(subtotal * (1 - DISCOUNT_RATE));
}
