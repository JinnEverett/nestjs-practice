// ex10 · parseFlag — đáp án best practice
//
// - Bảng tra (Set) cho giá trị true/false: dễ đọc, dễ bổ sung, tra cứu O(1).
// - Chuẩn hóa một lần: trim + toLowerCase.
// - Không dùng Boolean(value) hay !!value: chuỗi 'false' và '0' đều truthy.
// - "Fail fast": giá trị lạ → ném lỗi ngay lúc đọc config khi khởi động, thay vì chạy sai âm thầm
//   (một tính năng tưởng tắt mà đang bật trên production).
// Trong NestJS (C09) việc này nằm trong schema validate env của @nestjs/config.
const TRUE_VALUES = new Set(['true', '1', 'yes', 'on']);
const FALSE_VALUES = new Set(['false', '0', 'no', 'off', '']);

export function parseFlag(value, defaultValue = false) {
  if (value === undefined) return defaultValue;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (TRUE_VALUES.has(normalized)) return true;
    if (FALSE_VALUES.has(normalized)) return false;
  }
  throw new TypeError(`Invalid boolean flag: ${JSON.stringify(value)}`);
}
