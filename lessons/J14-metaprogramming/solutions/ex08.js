// ex08 · createAutoMock — đáp án best practice
//
// - Proxy với trap get: tạo LƯỜI một hàm ghi lời gọi cho mỗi tên, cache trong Map → cùng tên cùng hàm.
// - 'then' trả undefined: nếu không, `await mock` sẽ coi mock là thenable, gọi mock.then(resolve, reject)
//   → hàm giả không bao giờ gọi resolve → await TREO MÃI. Lỗi kinh điển khi viết proxy.
// - Symbol key → undefined (console.log, spread, inspect đọc Symbol.iterator, toPrimitive…).
// - API điều khiển (calls / mockReturn / mockImplementation) là hàm thật, không bị ghi lại.
// Thực tế: jest.fn / jest-mock-extended `mock<Repo>()`, hoặc @golevelup/ts-jest createMock() trong Nest (Q01).
export function createAutoMock() {
  const fns = new Map();
  const callLog = new Map();
  const impls = new Map();

  const api = {
    calls: (name) => [...(callLog.get(name) ?? [])],
    mockReturn: (name, value) => impls.set(name, () => value),
    mockImplementation: (name, fn) => impls.set(name, fn),
  };

  const methodFor = (name) => {
    if (!fns.has(name)) {
      fns.set(name, (...args) => {
        if (!callLog.has(name)) callLog.set(name, []);
        callLog.get(name).push(args);
        return impls.get(name)?.(...args);
      });
    }
    return fns.get(name);
  };

  return new Proxy(
    {},
    {
      get(_target, key) {
        if (typeof key === 'symbol' || key === 'then') return undefined;
        if (Object.hasOwn(api, key)) return api[key];
        return methodFor(key);
      },
    },
  );
}
