// ex04 · readonlyView — đáp án best practice
//
// - Trap get: giá trị là object → trả proxy read-only của object con (lười, chỉ khi được đọc).
// - WeakMap cache proxy theo object gốc → view.a === view.a và không tạo proxy mới mỗi lần đọc.
// - Chặn set / deleteProperty / defineProperty → mọi đường ghi đều bị chặn (push của mảng đi qua set).
// - Không copy dữ liệu → view luôn phản ánh object gốc ("live").
// So với Object.freeze: freeze khóa CHÍNH object (cả chủ sở hữu); view chỉ khóa người cầm view.
const proxies = new WeakMap();

const deny = () => {
  throw new TypeError('Read-only view');
};

export function readonlyView(target) {
  if (proxies.has(target)) return proxies.get(target);
  const proxy = new Proxy(target, {
    get(t, key, receiver) {
      const value = Reflect.get(t, key, receiver);
      return typeof value === 'object' && value !== null ? readonlyView(value) : value;
    },
    set: deny,
    deleteProperty: deny,
    defineProperty: deny,
  });
  proxies.set(target, proxy);
  return proxy;
}
