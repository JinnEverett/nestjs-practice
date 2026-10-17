// ex07 · OrderService — đáp án best practice
//
// Vấn đề của bản cũ: tự `new` DB/mailer (không thay được bằng fake), `new Date()` (không kiểm thời gian được),
// đọc process.env bên trong (cấu hình rải rác), và mail lỗi làm hỏng cả request dù đơn đã lưu.
//
// - Ba dependency là INTERFACE nhỏ (Interface Segregation), tiêm qua constructor (Dependency Inversion).
// - Clock là dependency → test cố định thời gian.
// - Gửi mail là side effect KHÔNG được làm hỏng nghiệp vụ chính: bắt lỗi, không ném lại. Production nên đẩy
//   vào queue để retry (P03, R04) thay vì nuốt lỗi; ở đây tối thiểu nên log (bỏ qua để giữ ví dụ ngắn).
export interface Order {
  id: number;
  customerEmail: string;
  total: number;
  createdAt: Date;
}
export interface OrderRepository {
  save(data: Omit<Order, 'id'>): Promise<Order>;
}
export interface Mailer {
  send(to: string, subject: string): Promise<void>;
}
export interface Clock {
  now(): Date;
}

export class OrderService {
  constructor(
    private readonly orders: OrderRepository,
    private readonly mailer: Mailer,
    private readonly clock: Clock,
  ) {}

  async placeOrder(input: { customerEmail: string; total: number }): Promise<Order> {
    if (!(input.total > 0)) throw new RangeError(`Invalid total: ${input.total}`);
    const order = await this.orders.save({ ...input, createdAt: this.clock.now() });
    try {
      await this.mailer.send(order.customerEmail, `Đơn #${order.id} đã được tạo`);
    } catch {
      // Không làm hỏng đơn đã lưu. Production: log + đẩy vào hàng đợi gửi lại.
    }
    return order;
  }
}
