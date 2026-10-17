// ex02 · createEnum — đáp án best practice
//
// - Object.fromEntries tạo các key enumerable; method phụ gắn bằng defineProperties với enumerable: false
//   → không lẫn vào Object.keys / JSON / for...in.
// - has dùng Set riêng chứa đúng các tên → 'toString', 'values' không khớp nhầm.
// - Object.freeze → gán/thêm ném TypeError (strict mode).
// TypeScript có `enum`, nhưng nhiều team thích `as const` object + union type (T02) — ý tưởng giống bài này.
export function createEnum(names) {
  const set = new Set(names);
  if (set.size !== names.length) throw new Error('Duplicate enum names');

  const result = Object.fromEntries(names.map((name) => [name, name]));
  Object.defineProperties(result, {
    values: { value: () => [...names], enumerable: false },
    has: { value: (value) => set.has(value), enumerable: false },
  });
  return Object.freeze(result);
}
