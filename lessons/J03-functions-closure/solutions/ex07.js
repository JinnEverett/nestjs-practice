// ex07 · withLogging — đáp án best practice
//
// - `function` thường + `fn.apply(this, args)` → giữ được `this` khi bọc method của object/class.
// - `performance.now()` (độ phân giải cao, đơn điệu) thay vì Date.now() để đo thời gian chạy.
// - Log lỗi rồi `throw error` lại — wrapper KHÔNG được nuốt lỗi hay đổi lỗi, caller vẫn phải
//   nhận được lỗi gốc để xử lý.
// - Đây chính là khuôn mẫu của LoggingInterceptor trong NestJS (C08).
export function withLogging(fn, logger) {
  return function (...args) {
    const start = performance.now();
    try {
      const result = fn.apply(this, args);
      logger.info({ fn: fn.name, args, ms: performance.now() - start });
      return result;
    } catch (error) {
      logger.error({ fn: fn.name, args, error });
      throw error;
    }
  };
}
