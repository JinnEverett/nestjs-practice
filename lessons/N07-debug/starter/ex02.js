// 🐞 Hai chỗ rò bộ nhớ. Copy sang answers/ex02.js rồi sửa.

// Pub/sub tối giản. Không có cách nào gỡ listener.
export function createHub() {
  const listeners = {};
  return {
    on(event, handler) {
      (listeners[event] ??= []).push(handler);
    },
    emit(event, ...args) {
      for (const h of listeners[event] ?? []) h(...args);
    },
    listenerCount(event) {
      return (listeners[event] ?? []).length;
    },
  };
}

// Cache kết quả theo đối số đầu tiên. Không giới hạn kích thước; cache luôn cả promise bị reject.
export function memoize(fn) {
  const cache = new Map();
  return (key) => {
    if (!cache.has(key)) cache.set(key, fn(key));
    return cache.get(key);
  };
}
