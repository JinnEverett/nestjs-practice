// ex01 · pipe — đáp án best practice
//
// - `reduce` là đúng nghĩa đen của "đưa kết quả bước trước vào bước sau".
// - Giá trị khởi tạo là `x` → không có hàm nào thì trả về chính `x` (identity) mà không cần if.
// - Trả về arrow function → closure giữ mảng `fns`.
export function pipe(...fns) {
  return (x) => fns.reduce((acc, fn) => fn(acc), x);
}
