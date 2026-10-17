// ex01 · LineItem — đáp án best practice
//
// - interface cho hình dạng object được dùng lại ở nhiều nơi; export để file khác import (kể cả `import type`).
// - Ghi rõ kiểu trả về của hàm export: hợp đồng ổn định, lỗi xuất hiện ngay trong hàm chứ không lan ra caller.
// - Destructuring tham số giữ được kiểu (TS suy ra từ annotation LineItem).
export interface LineItem {
  name: string;
  qty: number;
  unitPrice: number;
}

export function lineTotal({ qty, unitPrice }: LineItem): number {
  return qty * unitPrice;
}

export function formatLine(item: LineItem): string {
  return `${item.qty} × ${item.name} = ${lineTotal(item)}`;
}
