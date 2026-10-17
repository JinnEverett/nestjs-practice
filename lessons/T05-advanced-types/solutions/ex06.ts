// ex06 · Key remapping & template literal — đáp án best practice
//
// - Template literal type sinh union tên event từ một tham số → không gõ tay từng chuỗi.
// - `as \`get${Capitalize<K>}\`` đổi tên key trong mapped type; `keyof T & string` loại key symbol/number.
// - Runtime: duyệt Object.keys, dựng tên giống hệt luật của kiểu; một ép kiểu ở cuối vì TS không suy
//   kiểu remapped từ Object.fromEntries.
export type EventName<E extends string> = `${E}.created` | `${E}.updated` | `${E}.deleted`;

export type Getters<T> = { [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K] };

export function createGetters<T extends Record<string, unknown>>(obj: T): Getters<T> {
  const entries = Object.keys(obj).map((key) => [`get${key.charAt(0).toUpperCase()}${key.slice(1)}`, () => obj[key]]);
  return Object.fromEntries(entries) as Getters<T>;
}
