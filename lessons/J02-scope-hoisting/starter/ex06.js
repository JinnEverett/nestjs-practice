// J02 · ex06 — không chạy được (SyntaxError). Viết lại đúng vào answers/ex06.js
export function describeStatus(status) {
  switch (status) {
    case 'pending':
      const label = 'Chờ xử lý';
      const color = 'gray';
      return { label, color };
    case 'paid':
      const label = 'Đã thanh toán';
      const color = 'blue';
      return { label, color };
    // ... còn shipped, delivered, cancelled
  }
}
