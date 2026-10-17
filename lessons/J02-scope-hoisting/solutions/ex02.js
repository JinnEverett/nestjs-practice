// ex02 · makeHandlers — đáp án best practice
//
// Bug gốc: `var i` có MỘT biến dùng chung cho cả vòng lặp; các hàm được gọi SAU khi vòng lặp xong,
// lúc đó i = 3 và names[3] = undefined.
//
// Cách chuẩn: `map` — mỗi lần gọi callback có tham số `name`, `index` riêng, được closure "chụp" lại.
// - Không cần biến đếm, không cần mảng tạm, không thể lệch chỉ số.
// - Chụp `name` (giá trị) thay vì `names[i]` (tra lại lúc gọi) → sửa mảng gốc sau đó không ảnh hưởng.
export function makeHandlers(names) {
  return names.map((name, index) => () => `Hello, ${name} #${index}`);
}

// Cách sửa tối thiểu (cũng đúng): đổi `var i` thành `let i` và chụp tên trước:
//   for (let i = 0; i < names.length; i++) { const name = names[i]; handlers.push(() => `Hello, ${name} #${i}`); }
