// ex06 · getEnv — đáp án best practice
//
// - Hai chữ ký overload mô tả hợp đồng cho caller; chữ ký cài đặt (cuối) không thấy được từ ngoài.
// - Kết quả: có fallback thì kiểu trả về là string — caller không phải `!` hay kiểm undefined.
// - `|| undefined` biến chuỗi rỗng thành "thiếu" (env rỗng thường là cấu hình lỗi).
// Cách khác không cần overload: generic `getEnv<F extends string | undefined>(…, fallback?: F)` — phức tạp hơn, overload dễ đọc hơn ở đây.
type Env = Record<string, string | undefined>;

export function getEnv(env: Env, key: string): string | undefined;
export function getEnv(env: Env, key: string, fallback: string): string;
export function getEnv(env: Env, key: string, fallback?: string): string | undefined {
  return env[key] || fallback;
}
