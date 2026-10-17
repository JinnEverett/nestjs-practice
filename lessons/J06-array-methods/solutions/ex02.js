// ex02 · sortProducts — đáp án best practice
//
// - `toSorted` (Node 20+) trả mảng mới → không mutate input. Trước Node 20: `[...products].sort(...)`.
// - Comparator số: `a.price - b.price`. KHÔNG để mặc định (so chuỗi: '100' < '9').
// - Tiêu chí phụ nối bằng `||`: khi hiệu giá là 0 (falsy) mới so tên.
// - `localeCompare(…, 'vi')` xếp Đ sau D, Ấ/Ă sau A đúng thói quen người Việt.
//   Sort danh sách rất lớn nhiều lần: tạo một `new Intl.Collator('vi')` và dùng `collator.compare` (nhanh hơn).
export function sortProducts(products) {
  return products.toSorted((a, b) => a.price - b.price || a.name.localeCompare(b.name, 'vi'));
}
