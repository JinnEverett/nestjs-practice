// ex07 · runAll — đáp án best practice
//
// - Mỗi task trong try/catch riêng → lỗi không chặn task sau.
// - Kết quả và lỗi được ghi theo index → giữ thứ tự, caller biết task nào lỗi.
// - AggregateError là lỗi chuẩn cho "nhiều lỗi cùng lúc" (Promise.any cũng dùng nó — J11).
// - Gắn `results` lên lỗi để caller vẫn dùng được phần thành công (partial success).
import { ensureError } from './ex04.js';

export function runAll(tasks) {
  const results = [];
  const errors = [];
  tasks.forEach((task, i) => {
    try {
      results[i] = task();
    } catch (error) {
      results[i] = undefined;
      errors.push(ensureError(error));
    }
  });
  if (errors.length > 0) {
    const aggregate = new AggregateError(errors, `${errors.length}/${tasks.length} tasks failed`);
    aggregate.results = results;
    throw aggregate;
  }
  return results;
}
