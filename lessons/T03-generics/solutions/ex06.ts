// ex06 · mergeDefaults / sortByKey — đáp án best practice
//
// - mergeDefaults: Partial<T> chỉ cho phép key có trong T; lọc undefined để không xóa mất default.
// - sortByKey: kiểu SortableKey<T> = các key mà T[key] là string | number (mapped type + indexed access — T05).
//   Nhờ đó 'active' (boolean) và 'tags' (mảng) bị chặn lúc biên dịch.
// - So sánh tách nhánh string/number; trả mảng mới (toSorted).
type SortableKey<T> = { [K in keyof T]: T[K] extends string | number ? K : never }[keyof T];

export function mergeDefaults<T extends object>(defaults: T, overrides: Partial<T>): T {
  const defined = Object.fromEntries(Object.entries(overrides).filter(([, v]) => v !== undefined));
  return { ...defaults, ...defined };
}

export function sortByKey<T, K extends SortableKey<T>>(items: readonly T[], key: K, dir: 'asc' | 'desc' = 'asc'): T[] {
  const sign = dir === 'asc' ? 1 : -1;
  return items.toSorted((a, b) => {
    const x = a[key];
    const y = b[key];
    const cmp = typeof x === 'string' && typeof y === 'string' ? x.localeCompare(y, 'vi') : Number(x) - Number(y);
    return cmp * sign;
  });
}
