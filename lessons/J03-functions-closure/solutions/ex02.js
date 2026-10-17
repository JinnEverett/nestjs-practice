// ex02 · once — đáp án best practice
//
// - Cờ `called` tách riêng khỏi `result` → nhớ đúng cả khi kết quả là undefined
//   (kiểm tra `if (result === undefined)` sẽ sai).
// - Chỉ bật cờ SAU khi fn chạy thành công → lỗi được ném ra và lần sau thử lại
//   (phù hợp cho "khởi tạo kết nối một lần": lần đầu lỗi mạng thì lần sau thử lại).
// - Dùng `function` thường + `fn.apply(this, args)` để giữ `this` khi bọc method;
//   arrow function không có `this` riêng nên sẽ làm mất ngữ cảnh.
export function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (!called) {
      result = fn.apply(this, args);
      called = true;
    }
    return result;
  };
}
