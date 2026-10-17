// ex02 · isBlank — đáp án best practice
//
// - `value == null` bắt cả null lẫn undefined: đây là chỗ hiếm hoi `==` được dùng có chủ đích.
// - Chỉ chuỗi mới được trim; kiểm tra `typeof` trước để không gọi `.trim()` trên số/object.
// - Không dùng `!value`: 0, false, NaN là falsy nhưng KHÔNG "trống" theo nghĩa nghiệp vụ.
// - `String.prototype.trim` bỏ mọi whitespace (space, tab, \n, NBSP...).
export function isBlank(value) {
  if (value == null) return true;
  return typeof value === 'string' && value.trim() === '';
}
