// ex06 · createPrice — đáp án best practice
//
// - Symbol.toPrimitive(hint): 'string' khi ở template literal / String(); 'number' khi +p, p > 100;
//   'default' khi p + 1 / p == x → chọn số để phép toán đúng.
// - Symbol.toStringTag đổi nhãn trong Object.prototype.toString (hữu ích khi debug/log).
// - toJSON quyết định dạng khi serialize — client nhận số, không nhận chuỗi định dạng.
// - Formatter tạo một lần.
// Đừng lạm dụng ép kiểu ngầm trong code nghiệp vụ: `price.amount` tường minh dễ đọc hơn `+price`.
const VND = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

export function createPrice(amount) {
  return {
    get amount() {
      return amount;
    },
    [Symbol.toPrimitive](hint) {
      return hint === 'string' ? VND.format(amount) : amount;
    },
    get [Symbol.toStringTag]() {
      return 'Price';
    },
    toJSON() {
      return amount;
    },
  };
}
