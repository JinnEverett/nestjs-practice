// ex05 · retry — đáp án best practice
//
// - Vòng for đếm attempt từ 1 → retries + 1; thành công thì return ngay.
// - Lỗi: hết lượt HOẶC shouldRetry trả false → ném lỗi gốc (không bọc, để caller phân loại được).
// - Delay theo công thức exponential, chặn trên bằng maxDelayMs.
// - sleep tiêm vào → test không phải chờ thật; mặc định dùng node:timers/promises.
// Production: thêm jitter (vd. delay * (0.5 + Math.random() / 2)) để tránh nhiều client retry đồng loạt;
// chỉ retry lỗi tạm thời và thao tác idempotent.
import { setTimeout as delay } from 'node:timers/promises';

export async function retry(fn, { retries = 3, baseDelayMs = 100, factor = 2, maxDelayMs = Infinity, shouldRetry = () => true, sleep = delay } = {}) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      if (attempt > retries || !shouldRetry(error, attempt)) throw error;
      await sleep(Math.min(baseDelayMs * factor ** (attempt - 1), maxDelayMs));
    }
  }
}
