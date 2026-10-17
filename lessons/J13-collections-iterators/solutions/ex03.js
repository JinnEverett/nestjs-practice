// ex03 · range (iterator protocol thủ công) — đáp án best practice
//
// - Trả về object ITERABLE (có [Symbol.iterator]) chứ không phải iterator → mỗi lần duyệt gọi
//   [Symbol.iterator]() tạo bộ đếm MỚI → duyệt lại nhiều lần được.
// - Điều kiện dừng phụ thuộc dấu của step (tăng: < end; lùi: > end).
// - Validate step ngay khi tạo, không đợi tới lúc duyệt.
// Bản generator ngắn hơn: function* range(...) { for (let i = start; step > 0 ? i < end : i > end; i += step) yield i; }
// (nhưng generator object chỉ duyệt được MỘT lần nếu trả thẳng generator).
export function range(start, end, step = 1) {
  if (step === 0) throw new RangeError('step must not be 0');
  return {
    [Symbol.iterator]() {
      let current = start;
      return {
        next() {
          const inRange = step > 0 ? current < end : current > end;
          if (!inRange) return { value: undefined, done: true };
          const value = current;
          current += step;
          return { value, done: false };
        },
      };
    },
  };
}
