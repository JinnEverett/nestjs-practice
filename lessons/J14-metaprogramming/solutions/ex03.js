// ex03 · createValidatedObject — đáp án best practice
//
// - Trap `set` kiểm schema rồi gọi Reflect.set (hành vi mặc định) — trả true để strict mode không ném.
// - Object.hasOwn(schema, key) thay vì `key in schema` → 'toString' không lọt qua.
// - Trap `deleteProperty` ném lỗi.
// - initial được gán QUA proxy → dùng chung đúng một đường validate.
// Trong NestJS, việc này là class-validator trên DTO (C05) — chạy một lần ở biên, không phải Proxy bọc mọi object.
export function createValidatedObject(schema, initial = {}) {
  const proxy = new Proxy(
    {},
    {
      set(target, key, value, receiver) {
        if (!Object.hasOwn(schema, key)) throw new TypeError(`Unknown field: ${String(key)}`);
        if (typeof value !== schema[key]) throw new TypeError(`${String(key)} must be ${schema[key]}, got ${typeof value}`);
        return Reflect.set(target, key, value, receiver);
      },
      deleteProperty(_target, key) {
        throw new TypeError(`Cannot delete field: ${String(key)}`);
      },
    },
  );
  Object.assign(proxy, initial);
  return proxy;
}
