// ex02 · groupBy — đáp án best practice
//
// - Hai tham số kiểu: T (phần tử) và K (key) — K được suy ra từ kiểu trả về của keyFn, nên status union
//   giữ nguyên là union thay vì rơi về string.
// - Map giữ đúng kiểu key (boolean, number, object) và thứ tự chèn.
// Node 21+: Map.groupBy(items, keyFn) làm đúng việc này với kiểu tương tự.
export function groupBy<T, K>(items: readonly T[], keyFn: (item: T) => K): Map<K, T[]> {
  const groups = new Map<K, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }
  return groups;
}
