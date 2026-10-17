// ex04 · Payment — đáp án best practice
//
// - Union với `type` phân biệt: mỗi phương thức chỉ có field của nó; dữ liệu vô lý không biểu diễn được.
// - Mỗi hàm một switch exhaustive (assertNever) → thêm 'ewallet' là compiler chỉ ra mọi chỗ cần sửa.
// - Phí là luật nghiệp vụ → hằng số có tên.
export type Payment = { type: 'card'; last4: string } | { type: 'bank'; bankCode: string; accountNo: string } | { type: 'cod' };

const CARD_FEE_RATE = 0.02;
const COD_FEE = 15_000;

const assertNever = (x: never): never => {
  throw new Error(`Unhandled payment: ${JSON.stringify(x)}`);
};

export function describePayment(p: Payment): string {
  switch (p.type) {
    case 'card':
      return `Thẻ •••• ${p.last4}`;
    case 'bank':
      return `Chuyển khoản ${p.bankCode} - ****${p.accountNo.slice(-4)}`;
    case 'cod':
      return 'Thanh toán khi nhận hàng';
    default:
      return assertNever(p);
  }
}

export function feeFor(p: Payment, amount: number): number {
  switch (p.type) {
    case 'card':
      return Math.round(amount * CARD_FEE_RATE);
    case 'bank':
      return 0;
    case 'cod':
      return COD_FEE;
    default:
      return assertNever(p);
  }
}
