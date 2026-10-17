// ex02 · Measure / Memoize — đáp án best practice
//
// - Thay descriptor.value bằng `function` thường và gọi original.apply(this, args) → giữ this.
// - Measure: nếu kết quả là Promise → đo trong .finally (async method), ngược lại đo ngay; lỗi đồng bộ cũng đo rồi ném lại.
//   Label lấy từ target.constructor.name (target của method decorator là prototype).
// - Memoize: WeakMap<instance, Map<arg, value>> → cache riêng mỗi instance, instance bị GC thì cache biến mất.
//   has() để nhớ cả undefined.
import 'reflect-metadata';

type AnyMethod = (this: unknown, ...args: unknown[]) => unknown;

export function Measure(sink: (label: string, ms: number) => void) {
  return (target: object, key: string | symbol, descriptor: PropertyDescriptor): void => {
    const original = descriptor.value as AnyMethod;
    const label = `${target.constructor.name}.${String(key)}`;
    descriptor.value = function (this: unknown, ...args: unknown[]) {
      const start = performance.now();
      const done = () => sink(label, performance.now() - start);
      let result: unknown;
      try {
        result = original.apply(this, args);
      } catch (error) {
        done();
        throw error;
      }
      if (result instanceof Promise) return result.finally(done);
      done();
      return result;
    };
  };
}

export function Memoize() {
  return (_target: object, _key: string | symbol, descriptor: PropertyDescriptor): void => {
    const original = descriptor.value as AnyMethod;
    const caches = new WeakMap<object, Map<unknown, unknown>>();
    descriptor.value = function (this: object, ...args: unknown[]) {
      let cache = caches.get(this);
      if (!cache) {
        cache = new Map();
        caches.set(this, cache);
      }
      const key = args[0];
      if (cache.has(key)) return cache.get(key);
      const value = original.apply(this, args);
      cache.set(key, value);
      return value;
    };
  };
}
