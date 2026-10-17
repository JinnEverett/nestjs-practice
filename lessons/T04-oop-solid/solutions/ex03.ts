// ex03 · PaymentService — đáp án best practice (Dependency Inversion)
//
// - PaymentService phụ thuộc vào INTERFACE PaymentGateway, nhận qua constructor → đổi Stripe/VNPay/fake mà không sửa service.
// - Validate trước khi gọi ra ngoài (không tốn một request thanh toán cho input sai).
// - Trả record có kiểu rõ ràng.
// Trong NestJS: interface không tồn tại lúc chạy nên cần injection token: @Inject(PAYMENT_GATEWAY) (C03).
export interface PaymentGateway {
  charge(amount: number, token: string): Promise<{ transactionId: string }>;
}

export interface PaymentRecord {
  orderId: number;
  amount: number;
  transactionId: string;
}

export class PaymentService {
  constructor(private readonly gateway: PaymentGateway) {}

  async pay(orderId: number, amount: number, token: string): Promise<PaymentRecord> {
    if (!Number.isInteger(amount) || amount <= 0) throw new RangeError(`Invalid amount: ${amount}`);
    const { transactionId } = await this.gateway.charge(amount, token);
    return { orderId, amount, transactionId };
  }
}
