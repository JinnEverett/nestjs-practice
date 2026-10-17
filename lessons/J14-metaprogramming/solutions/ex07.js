// ex07 · createMetadataRegistry — đáp án best practice
//
// - Cấu trúc: WeakMap<target, Map<propertyKey, Map<metadataKey, value>>>.
//   WeakMap → không giữ class/prototype sống; propertyKey undefined = metadata của chính class.
// - getMetadata lần theo Object.getPrototypeOf: class Child extends Base có prototype (phía static) là Base,
//   Child.prototype có prototype là Base.prototype → method lẫn class đều kế thừa metadata.
// - getMetadataKeys gom own trước rồi tới tổ tiên, Set loại trùng.
// Đây là cách reflect-metadata hoạt động; Nest dùng nó qua Reflector (C08), TypeScript ghi sẵn
// design:paramtypes / design:type khi bật emitDecoratorMetadata (T06).
export function createMetadataRegistry() {
  const store = new WeakMap();

  const ownMap = (target, propertyKey, create) => {
    let byProperty = store.get(target);
    if (!byProperty) {
      if (!create) return undefined;
      byProperty = new Map();
      store.set(target, byProperty);
    }
    let meta = byProperty.get(propertyKey);
    if (!meta && create) {
      meta = new Map();
      byProperty.set(propertyKey, meta);
    }
    return meta;
  };

  const chain = function* (target) {
    for (let t = target; t !== null && t !== undefined; t = Object.getPrototypeOf(t)) yield t;
  };

  const getOwnMetadata = (key, target, propertyKey) => ownMap(target, propertyKey, false)?.get(key);

  return {
    defineMetadata(key, value, target, propertyKey) {
      ownMap(target, propertyKey, true).set(key, value);
    },
    getOwnMetadata,
    getMetadata(key, target, propertyKey) {
      for (const t of chain(target)) {
        const meta = ownMap(t, propertyKey, false);
        if (meta?.has(key)) return meta.get(key);
      }
      return undefined;
    },
    hasMetadata(key, target, propertyKey) {
      for (const t of chain(target)) if (ownMap(t, propertyKey, false)?.has(key)) return true;
      return false;
    },
    getMetadataKeys(target, propertyKey) {
      const keys = new Set();
      for (const t of chain(target)) for (const k of ownMap(t, propertyKey, false)?.keys() ?? []) keys.add(k);
      return [...keys];
    },
  };
}
