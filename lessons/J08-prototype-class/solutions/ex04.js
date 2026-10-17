// ex04 · EventBus — đáp án best practice
//
// - #handlers: Map<event, Set<handler>> — Set tự loại trùng, xóa O(1), giữ thứ tự chèn.
// - emit duyệt trên BẢN COPY ([...set]) → handler thêm/bớt trong lúc emit không làm hỏng vòng lặp
//   và handler mới không chạy ở lần đó.
// - once bọc handler; wrapper tự off chính nó trước khi gọi. (Lưu ý: off(event, handlerGốc) không gỡ
//   được wrapper — bản đầy đủ lưu map gốc→wrapper; Node EventEmitter làm việc này qua thuộc tính listener.)
// - on trả về hàm unsubscribe → caller không cần giữ tham chiếu handler.
// - Dọn Set rỗng để Map không phình theo số event đã từng dùng.
export class EventBus {
  #handlers = new Map();

  on(event, handler) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event).add(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const set = this.#handlers.get(event);
    if (!set) return;
    set.delete(handler);
    if (set.size === 0) this.#handlers.delete(event);
  }

  once(event, handler) {
    const wrapper = (payload) => {
      this.off(event, wrapper);
      handler(payload);
    };
    return this.on(event, wrapper);
  }

  emit(event, payload) {
    const handlers = [...(this.#handlers.get(event) ?? [])];
    for (const handler of handlers) handler(payload);
    return handlers.length;
  }
}
