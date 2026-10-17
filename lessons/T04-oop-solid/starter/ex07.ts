// T04 · ex07 — không test được. Viết lại vào answers/ex07.ts
// @ts-nocheck
import { PostgresDb } from './db';
import { SmtpMailer } from './mailer';

export class OrderService {
  private db = new PostgresDb(process.env.DATABASE_URL);
  private mailer = new SmtpMailer('smtp.gmail.com');

  async placeOrder(input) {
    const order = await this.db.insert('orders', { ...input, createdAt: new Date() });
    await this.mailer.send(input.customerEmail, `Đơn #${order.id} đã được tạo`); // mail lỗi → cả request lỗi dù đơn đã lưu
    return order;
  }
}
