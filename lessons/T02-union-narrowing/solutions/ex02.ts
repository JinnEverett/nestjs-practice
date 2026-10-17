// ex02 · Shape — đáp án best practice
//
// - Trường phân biệt `kind` là literal ở mỗi nhánh → switch thu hẹp đúng nhánh, chỉ thấy field của nhánh đó.
// - `default: return assertNever(s)`: khi mọi case đã xử lý, s có kiểu never. Thêm 'hexagon' vào Shape mà
//   quên case → s không còn là never → LỖI BIÊN DỊCH chỉ đúng chỗ cần sửa.
// - assertNever vẫn ném lỗi lúc chạy cho dữ liệu lạ lọt từ JSON (kiểu chỉ tồn tại lúc biên dịch).
export type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rect'; width: number; height: number }
  | { kind: 'triangle'; base: number; height: number };

export function assertNever(x: never): never {
  throw new Error(`Unhandled case: ${JSON.stringify(x)}`);
}

export function area(s: Shape): number {
  switch (s.kind) {
    case 'circle':
      return Math.PI * s.radius ** 2;
    case 'rect':
      return s.width * s.height;
    case 'triangle':
      return (s.base * s.height) / 2;
    default:
      return assertNever(s);
  }
}
