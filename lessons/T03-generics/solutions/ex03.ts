// ex03 · pick — đáp án best practice
//
// - `K extends keyof T`: chỉ nhận key có thật; Pick<T, K> mô tả chính xác kết quả.
// - Kiểu mảng `readonly K[]` cho phép truyền cả mảng `as const`.
// - Bên trong phải dựng object từng bước nên cần MỘT ép kiểu `{} as Pick<T, K>` lúc khởi tạo — TS không chứng minh
//   được object rỗng sẽ đủ key sau vòng lặp. Ép kiểu nằm gọn trong hàm, API bên ngoài vẫn an toàn (lodash cũng làm vậy).
export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (Object.hasOwn(obj, key)) result[key] = obj[key];
  }
  return result;
}
