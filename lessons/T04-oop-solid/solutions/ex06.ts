// ex06 · LegacyPayAdapter — đáp án best practice (Adapter)
//
// - Adapter implement interface CỦA TA (PaymentGateway) và bọc SDK bên ngoài → phần còn lại của hệ thống
//   không biết SDK tồn tại; đổi nhà cung cấp chỉ viết adapter mới.
// - Chuyển callback → Promise một lần ở đây; map tên field (amt, txn_id) và map lỗi sang Error chuẩn.
// - SDK được tiêm qua constructor → test thay bằng client giả.
// Đây là "anti-corruption layer" thu nhỏ: chặn mô hình dữ liệu lạ tràn vào code nghiệp vụ.
import type { PaymentGateway } from './ex03.js';
import type { LegacyPayClient } from '../starter/legacy-pay.js';

export class LegacyPayAdapter implements PaymentGateway {
  constructor(private readonly client: LegacyPayClient) {}

  charge(amount: number, token: string): Promise<{ transactionId: string }> {
    return new Promise((resolve, reject) => {
      this.client.makePayment({ amt: amount, cardToken: token }, (err, res) => {
        if (err) reject(new Error(`${err.code}: ${err.msg}`));
        else if (!res) reject(new Error('Empty response from payment provider'));
        else resolve({ transactionId: res.txn_id });
      });
    });
  }
}
