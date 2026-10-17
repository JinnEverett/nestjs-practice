// ex02 · parsePort — đáp án best practice
//
// - `unknown` buộc phải thu hẹp kiểu trước khi dùng → không thể vô tình gọi value.trim() trên số.
// - Mỗi nhánh `typeof` thu hẹp (narrowing): trong `if (typeof value === 'string')`, value là string.
// - Gom phần validate khoảng vào một chỗ sau khi đã có number.
// - Không dùng `any` (tắt kiểm tra) hay `as number` (nói dối compiler).
const DIGITS = /^\d+$/;

export function parsePort(value: unknown): number {
  let port: number;
  if (typeof value === 'number') port = value;
  else if (typeof value === 'string' && DIGITS.test(value)) port = Number(value);
  else throw new TypeError(`Invalid port: ${String(value)}`);

  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new TypeError(`Invalid port: ${port}`);
  return port;
}
