// ex07 · chunk / uniqueBy — đáp án best practice
//
// chunk:
// - Validate trước (Number.isInteger loại '2', 1.5, NaN).
// - Array.from với length = ceil(n/size) và slice → không vòng lặp tay, không mutate.
// uniqueBy:
// - Set các key đã gặp → O(n). Set dùng SameValueZero nên NaN trùng NaN, '__proto__' là key bình thường.
// - filter giữ thứ tự và lần xuất hiện đầu.
export function chunk(arr, size) {
  if (!Number.isInteger(size) || size <= 0) throw new RangeError(`size must be a positive integer, got ${size}`);
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, (i + 1) * size));
}

export function uniqueBy(arr, keyFn) {
  const seen = new Set();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
