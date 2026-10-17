// ex03 · parseLimit — đáp án best practice
//
// - `Number(s)` từ chối cả chuỗi ('12abc' → NaN) thay vì đọc nửa chừng như parseInt.
// - `Number('')` và `Number('   ')` là 0 (bẫy!) → phải loại chuỗi rỗng TRƯỚC khi Number().
// - `Number.isInteger` loại luôn NaN, Infinity và 3.5 trong một phép kiểm tra.
// - Hằng số đặt tên rõ ràng thay vì số "ma thuật" rải trong code.
// - Kẹp giá trị bằng Math.min/Math.max — gọn, không cần nhiều if.
const DEFAULT_LIMIT = 20;
const MIN_LIMIT = 1;
const MAX_LIMIT = 100;

export function parseLimit(raw) {
  const text = raw?.trim();
  if (!text) return DEFAULT_LIMIT; // undefined hoặc ''
  const n = Number(text);
  if (!Number.isInteger(n)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(MIN_LIMIT, n));
}

// Trong NestJS (C05) bạn sẽ không tự viết hàm này mà khai báo DTO:
//   @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 20;
// Nhưng bên dưới nó làm đúng các bước trên.
