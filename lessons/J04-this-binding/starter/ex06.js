// J04 · ex06 — code có bug. Viết lại đúng vào answers/ex06.js
export class OrderService {
  constructor(emitter, notifier) {
    this.notifier = notifier;
    emitter.on('order.created', this.handleOrderCreated);
  }
  handleOrderCreated(order) {
    this.notifier.send(`Đơn ${order.id} đã tạo`);
  }
}
