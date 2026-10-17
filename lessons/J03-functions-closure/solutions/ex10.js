// ex10 · memoizeLRU — đáp án best practice
//
// - `Map` giữ thứ tự chèn → key đầu tiên trong `cache.keys()` là key cũ nhất.
// - "Dùng" một key = xóa rồi set lại → key đó chuyển xuống cuối (mới nhất). O(1).
// - Khi vượt maxSize: xóa key đầu tiên. Không cần danh sách liên kết tự viết.
// - `size` là getter (Object.defineProperty) → luôn phản ánh trạng thái hiện tại, chỉ đọc.
// Production: thư viện `lru-cache` (có thêm TTL, giới hạn theo dung lượng); hoặc Redis với
// maxmemory-policy allkeys-lru khi nhiều instance cần dùng chung cache (B07).
export function memoizeLRU(fn, maxSize) {
  const cache = new Map();

  const memoized = (key) => {
    if (cache.has(key)) {
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value);
      return value;
    }
    const value = fn(key);
    cache.set(key, value);
    if (cache.size > maxSize) {
      cache.delete(cache.keys().next().value);
    }
    return value;
  };

  Object.defineProperty(memoized, 'size', { get: () => cache.size });
  return memoized;
}
