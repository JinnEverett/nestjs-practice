// SDK thanh toán cũ (không sửa file này). Kiểu callback, tên field khác chuẩn của ta.
export interface LegacyPayRequest {
  amt: number;
  cardToken: string;
}
export interface LegacyPayError {
  code: string;
  msg: string;
}
export type LegacyCallback = (err: LegacyPayError | null, res?: { txn_id: string }) => void;

export class LegacyPayClient {
  makePayment(req: LegacyPayRequest, cb: LegacyCallback): void {
    setTimeout(() => {
      if (req.cardToken === 'tok_declined') cb({ code: 'E51', msg: 'Insufficient funds' });
      else cb(null, { txn_id: `TXN-${req.amt}-${req.cardToken.slice(-4)}` });
    }, 1);
  }
}
