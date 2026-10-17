// ex06 · curry — đáp án best practice
//
// - Mỗi lần gọi tạo MẢNG MỚI `[...collected, ...args]` thay vì push vào mảng dùng chung →
//   các nhánh (add1(2) và add1(10)) không giẫm lên nhau. Đây là lý do nên tránh mutate state dùng chung.
// - Đệ quy: chưa đủ `fn.length` tham số thì trả về hàm gom tiếp; đủ thì gọi fn.
// - Hàm 0 tham số: lần gọi đầu đã "đủ" → gọi luôn.
export function curry(fn) {
  const collect = (collected) => (...args) => {
    const all = [...collected, ...args];
    return all.length >= fn.length ? fn(...all) : collect(all);
  };
  return collect([]);
}
