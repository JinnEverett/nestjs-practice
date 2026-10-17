// ex06 · describeStatus — đáp án best practice
//
// - Bảng tra dữ liệu thay cho switch dài: thêm trạng thái mới = thêm 1 dòng.
// - `Map` (hoặc Object.hasOwn) để 'toString', 'constructor', '__proto__' không khớp nhầm với
//   thuộc tính kế thừa từ Object.prototype — lỗi kinh điển khi tra object thường bằng input người dùng.
// - Trả bản sao `{ ...entry }` → caller sửa kết quả cũng không làm hỏng bảng dùng chung
//   (bảng là module scope, sống suốt process — giống state trong singleton service).
const STATUS_INFO = new Map([
  ['pending', { label: 'Chờ xử lý', color: 'gray' }],
  ['paid', { label: 'Đã thanh toán', color: 'blue' }],
  ['shipped', { label: 'Đang giao', color: 'orange' }],
  ['delivered', { label: 'Đã giao', color: 'green' }],
  ['cancelled', { label: 'Đã hủy', color: 'red' }],
]);
const UNKNOWN = { label: 'Không rõ', color: 'gray' };

export function describeStatus(status) {
  return { ...(STATUS_INFO.get(status) ?? UNKNOWN) };
}

// Nếu vẫn muốn dùng switch: bọc mỗi case trong { } để mỗi case có block scope riêng:
//   case 'paid': { const label = 'Đã thanh toán'; return { label, color: 'blue' }; }
