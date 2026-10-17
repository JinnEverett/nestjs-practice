// ex09 · nextId — đáp án best practice
//
// - Validate bằng regex chặt `^\d+$` TRƯỚC khi chuyển: BigInt('0x10') và BigInt(' 1') đều hợp lệ
//   với BigInt nhưng không phải id hợp lệ của ta.
// - BigInt tính chính xác với số nguyên lớn tùy ý; cộng với `1n` (không trộn với number được).
// - Trả về String để giữ đúng "hợp đồng": id vào là chuỗi, ra cũng là chuỗi
//   (JSON.stringify không serialize được BigInt — sẽ ném TypeError).
// - Thông điệp lỗi có giá trị sai giúp debug nhanh.
const DIGITS_ONLY = /^\d+$/;

export function nextId(id) {
  if (typeof id !== 'string' || !DIGITS_ONLY.test(id)) {
    throw new TypeError(`Invalid id: ${String(id)}`);
  }
  return String(BigInt(id) + 1n);
}
