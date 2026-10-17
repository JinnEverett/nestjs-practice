// ex07 · getShippingCity — đáp án best practice
//
// - Optional chaining `?.` dừng ngay ở tầng null/undefined và trả undefined, không ném TypeError.
// - `?.find` cũng an toàn khi addresses là null.
// - `=== true` để 'true' (chuỗi) không lọt qua — dữ liệu từ JSON/DB hay bị sai kiểu.
// - `?? 'N/A'` giữ nguyên '' (chuỗi rỗng là dữ liệu hợp lệ). Dùng `||` sẽ biến '' thành 'N/A'.
export function getShippingCity(order) {
  return order?.customer?.addresses?.find((address) => address?.isDefault === true)?.city ?? 'N/A';
}
