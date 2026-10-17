export function createHub({ onError = () => {}, maxListeners = 10, onWarn = () => {} } = {}) {
  const listeners = new Map(); // event → Set<entry>
  const warned = new Set();

  function add(event, handler, once) {
    let set = listeners.get(event);
    if (!set) listeners.set(event, (set = new Set()));
    const entry = { handler, once };
    set.add(entry);
    if (set.size > maxListeners && !warned.has(event)) {
      warned.add(event);
      onWarn(event, set.size);
    }
    return () => {
      set.delete(entry); // idempotent
      if (set.size === 0 && listeners.get(event) === set) listeners.delete(event); // không giữ Set rỗng
    };
  }

  return {
    on: (event, handler) => add(event, handler, false),
    once: (event, handler) => add(event, handler, true),
    emit(event, ...args) {
      const set = listeners.get(event);
      if (!set) return 0;
      let called = 0;
      for (const entry of [...set]) { // snapshot: gỡ/đăng ký trong lúc emit không ảnh hưởng vòng này
        if (!set.has(entry)) continue; // đã bị gỡ bởi handler trước
        if (entry.once) set.delete(entry);
        called++;
        try {
          entry.handler(...args);
        } catch (err) {
          onError(err, event);
        }
      }
      if (set.size === 0 && listeners.get(event) === set) listeners.delete(event);
      return called;
    },
    listenerCount: (event) => listeners.get(event)?.size ?? 0,
  };
}

export function memoizeLru(fn, { max = 100 } = {}) {
  const cache = new Map(); // Map giữ thứ tự chèn → phần tử đầu là ít dùng nhất

  function memoized(arg) {
    const key = String(arg);
    if (cache.has(key)) {
      const value = cache.get(key);
      cache.delete(key);
      cache.set(key, value); // đánh dấu vừa dùng
      return value;
    }
    const value = fn(arg);
    cache.set(key, value);
    if (value && typeof value.then === 'function') {
      value.then(undefined, () => {
        if (cache.get(key) === value) cache.delete(key); // không cache lỗi
      });
    }
    while (cache.size > max) cache.delete(cache.keys().next().value);
    return value;
  }
  memoized.size = () => cache.size;
  memoized.clear = () => cache.clear();
  return memoized;
}
