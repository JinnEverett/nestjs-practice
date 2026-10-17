// ex04 · myBind — đáp án best practice
//
// - Closure giữ fn, thisArg, preset; hàm trả về nối tham số và gọi `fn.apply(thisArg, ...)`.
// - Hàm trả về là arrow → `this` của lời gọi bên ngoài bị bỏ qua hoàn toàn (đúng hành vi của bind:
//   b.call(other) không đổi được this).
// - Rest/spread thay cho `arguments` và Array.prototype.slice — hiện đại và rõ nghĩa.
export function myBind(fn, thisArg, ...preset) {
  return (...args) => fn.apply(thisArg, [...preset, ...args]);
}
