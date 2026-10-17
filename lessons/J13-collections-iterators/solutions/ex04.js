// ex04 · lazy generators — đáp án best practice
//
// - Mỗi hàm là generator: chỉ kéo phần tử kế tiếp từ nguồn khi chính nó bị kéo → ghép được với nguồn vô hạn.
// - take kiểm tra n <= 0 TRƯỚC khi duyệt → không kéo phần tử nào; return sau khi đủ → vòng for...of
//   tự gọi return() của nguồn (đóng tài nguyên nếu nguồn có finally).
// Thư viện: Iterator Helpers (Node 22+): naturals().map(f).filter(p).take(3) — có sẵn trên iterator.
export function* naturals() {
  for (let n = 0; ; n++) yield n;
}

export function* mapLazy(iterable, fn) {
  for (const x of iterable) yield fn(x);
}

export function* filterLazy(iterable, predicate) {
  for (const x of iterable) if (predicate(x)) yield x;
}

export function* take(iterable, n) {
  if (n <= 0) return;
  let remaining = n;
  for (const x of iterable) {
    yield x;
    if (--remaining === 0) return;
  }
}
