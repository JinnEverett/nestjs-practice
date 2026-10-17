// ex08 · createCoalescingCache — đáp án best practice
//
// - Ý chính: cache PROMISE chứ không cache giá trị. Caller thứ 2..N nhận cùng promise đang bay →
//   fetcher chỉ chạy 1 lần (chống cache stampede / thundering herd).
// - Lưu kèm thời điểm hết hạn; hết hạn thì coi như chưa có.
// - Lỗi: xóa entry (chỉ khi entry hiện tại vẫn là của lần gọi này — tránh xóa nhầm entry mới hơn),
//   rồi ném lại lỗi cho các caller. Không cache lỗi → lần sau thử lại.
// - Ghi entry vào Map TRƯỚC khi await → các get đồng thời đến sau thấy ngay.
// Production nhiều instance: kết hợp Redis + lock (SET NX) hoặc "stale-while-revalidate" (B07).
export function createCoalescingCache(fetcher, { ttlMs = Infinity, now = Date.now } = {}) {
  const entries = new Map();

  return {
    get(key) {
      const hit = entries.get(key);
      if (hit && now() < hit.expiresAt) return hit.promise;

      const entry = { expiresAt: Infinity, promise: undefined };
      entry.promise = Promise.resolve()
        .then(() => fetcher(key))
        .then(
          (value) => {
            entry.expiresAt = now() + ttlMs;
            return value;
          },
          (error) => {
            if (entries.get(key) === entry) entries.delete(key);
            throw error;
          },
        );
      entries.set(key, entry);
      return entry.promise;
    },
  };
}
