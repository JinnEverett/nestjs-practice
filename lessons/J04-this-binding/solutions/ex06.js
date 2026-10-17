// ex06 · OrderService — đáp án best practice
//
// Bug gốc: `emitter.on(evt, this.handleOrderCreated)` truyền method trần; emitter gọi nó với
// this = emitter (EventEmitter của Node) → this.notifier là undefined.
//
// - Tạo handler bằng arrow và LƯU vào field `#onOrderCreated` → vừa giữ this, vừa có đúng tham chiếu
//   để `off` sau này. (Viết `emitter.off(evt, (o) => this.handle(o))` là sai: hàm mới, khác hàm đã đăng ký.)
// - `#private` field: bên ngoài không truy cập được emitter/handler.
// - dispose() là nơi dọn listener — không dọn sẽ rò bộ nhớ (P06). Trong Nest dùng onModuleDestroy (C10),
//   hoặc @OnEvent của @nestjs/event-emitter (M02) để framework tự quản lý.
export class OrderService {
  #emitter;
  #onOrderCreated = (order) => this.handleOrderCreated(order);

  constructor(emitter, notifier) {
    this.notifier = notifier;
    this.#emitter = emitter;
    emitter.on('order.created', this.#onOrderCreated);
  }

  handleOrderCreated(order) {
    this.notifier.send(`Đơn ${order.id} đã tạo`);
  }

  dispose() {
    this.#emitter.off('order.created', this.#onOrderCreated);
  }
}
