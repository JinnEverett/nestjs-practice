// ex05 · ORDER_STATUSES — đáp án best practice
//
// - Một nguồn sự thật: mảng `as const` dùng lúc chạy (validate, render dropdown), kiểu union suy ra từ nó.
//   Thêm trạng thái mới = sửa đúng một dòng.
// - `(typeof ORDER_STATUSES)[number]`: "kiểu của phần tử bất kỳ" trong tuple → union literal.
// - Type guard `value is OrderStatus`: sau `if (isOrderStatus(x))` compiler biết x là OrderStatus.
// - Ép `ORDER_STATUSES as readonly string[]` chỉ để gọi includes với string — an toàn vì chỉ nới kiểu
//   của mảng hằng (không nói dối về giá trị đầu vào).
// Nhiều team dùng cách này thay cho `enum` của TS (enum sinh code lạ lúc chạy, không chạy với type stripping).
export const ORDER_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}
