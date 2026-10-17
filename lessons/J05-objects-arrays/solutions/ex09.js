// ex09 · addItem — đáp án best practice
//
// Bug gốc: (1) default param EMPTY_CART là MỘT object ở module scope → mọi khách không truyền cart
// cùng dùng chung và push vào nó; (2) `existing.qty += ...` và `push` sửa thẳng input.
//
// - Thứ tự tham số (cart, item) và bắt buộc truyền cart → không có state ẩn.
// - Validate trước: Number.isInteger loại '2', 1.5, NaN; > 0 loại 0 và số âm.
// - `some` để biết có dòng trùng không; `map` tạo mảng mới, chỉ dòng trùng được tạo object mới,
//   các dòng khác giữ tham chiếu (structural sharing).
// - Thêm `{ ...item }` thay vì `item` → giỏ không phụ thuộc object caller giữ.
export function addItem(cart, item) {
  if (!Number.isInteger(item.qty) || item.qty <= 0) {
    throw new RangeError(`qty must be a positive integer, got ${item.qty}`);
  }
  const exists = cart.items.some((line) => line.productId === item.productId);
  const items = exists
    ? cart.items.map((line) => (line.productId === item.productId ? { ...line, qty: line.qty + item.qty } : line))
    : [...cart.items, { ...item }];
  return { ...cart, items };
}
