// ex08 · createRateLimiter — đáp án best practice
//
// - State nằm trong closure (Map key → { windowStart, count }), mỗi limiter có Map riêng.
// - `now` được tiêm vào (mặc định Date.now) → test bằng đồng hồ giả, không phải sleep.
// - Một hàm `current(key)` lo việc "lấy bucket của cửa sổ hiện tại, hết hạn thì tạo mới"
//   → tryConsume và remaining không lặp logic.
// - Mảng/Map key theo IP sẽ lớn dần: bản production cần dọn key hết hạn (TTL) hoặc lưu Redis
//   với EXPIRE (A06 — @nestjs/throttler + Redis storage) để nhiều instance dùng chung.
export function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const buckets = new Map();

  const current = (key) => {
    const t = now();
    let bucket = buckets.get(key);
    if (!bucket || t - bucket.windowStart >= windowMs) {
      bucket = { windowStart: t, count: 0 };
      buckets.set(key, bucket);
    }
    return bucket;
  };

  return {
    tryConsume(key) {
      const bucket = current(key);
      if (bucket.count >= limit) return false;
      bucket.count++;
      return true;
    },
    remaining(key) {
      const bucket = buckets.get(key);
      if (!bucket || now() - bucket.windowStart >= windowMs) return limit;
      return limit - bucket.count;
    },
  };
}
