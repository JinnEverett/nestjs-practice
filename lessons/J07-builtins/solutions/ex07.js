// ex07 · parseDuration — đáp án best practice
//
// - Hai regex: một regex neo ^...$ để kiểm TOÀN BỘ chuỗi hợp lệ, một regex `g` để duyệt các cặp.
//   Chỉ dùng matchAll thì 'abc1h' vẫn "tìm thấy" 1h và lọt qua.
// - Thứ tự `ms|s|m|h|d`: 'ms' đứng trước 'm' để '5ms' không bị đọc thành 5m + 's'.
// - Bảng UNIT_MS thay cho chuỗi if/switch.
// Thư viện thật: `ms` (npm) — chính là thứ jsonwebtoken dùng cho expiresIn: '15m'.
const UNIT_MS = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const WHOLE = /^\s*(?:\d+(?:ms|s|m|h|d)\s*)+$/;
const PART = /(\d+)(ms|s|m|h|d)/g;

export function parseDuration(text) {
  if (!WHOLE.test(text)) throw new TypeError(`Invalid duration: ${JSON.stringify(text)}`);
  let total = 0;
  for (const [, amount, unit] of text.matchAll(PART)) total += Number(amount) * UNIT_MS[unit];
  return total;
}
