// ex05 · sumMoney — đáp án best practice
//
// - Đổi mỗi số sang cent (số nguyên) bằng Math.round(x * 100): 0.1 * 100 = 10.000000000000002 → round → 10.
//   Phép cộng số nguyên (dưới MAX_SAFE_INTEGER) là chính xác tuyệt đối.
// - Chia 100 đúng MỘT lần ở cuối → chỉ một lần làm tròn.
// - reduce với giá trị khởi tạo 0 → mảng rỗng trả 0, không ném lỗi. reduce không mutate mảng.
//
// Trong production: lưu tiền ở DB bằng `numeric(12,2)` hoặc số nguyên đơn vị nhỏ nhất (cent/đồng),
// và tính bằng số nguyên hoặc thư viện decimal (R09). Không dùng float để lưu tiền.
export function sumMoney(amounts) {
  const cents = amounts.reduce((total, amount) => total + Math.round(amount * 100), 0);
  return cents / 100;
}
