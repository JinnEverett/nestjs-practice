// ex02 · Set operations — đáp án best practice
//
// - Chuyển b thành Set MỘT lần (O(m)) rồi duyệt a → mỗi phép O(n + m); dùng array.includes sẽ là O(n·m).
// - Duyệt a qua `new Set(a)` / spread → nhận mọi iterable, giữ thứ tự, tự loại trùng.
// - Không mutate input, luôn trả Set mới.
// Node 22+: new Set(a).union(new Set(b)), .intersection, .difference, .symmetricDifference, .isSubsetOf.
export const union = (a, b) => new Set([...a, ...b]);

export function intersection(a, b) {
  const right = new Set(b);
  return new Set([...a].filter((x) => right.has(x)));
}

export function difference(a, b) {
  const right = new Set(b);
  return new Set([...a].filter((x) => !right.has(x)));
}

export function symmetricDifference(a, b) {
  const left = new Set(a);
  const right = new Set(b);
  return new Set([...[...left].filter((x) => !right.has(x)), ...[...right].filter((x) => !left.has(x))]);
}

export function isSubsetOf(a, b) {
  const right = new Set(b);
  return [...a].every((x) => right.has(x));
}
