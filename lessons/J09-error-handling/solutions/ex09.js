// ex09 · createErrorHandler — đáp án best practice
//
// - Tái sử dụng toErrorResponse (ex03) cho phần map, chỉ thêm chính sách của tầng biên:
//   giấu message 5xx ở production, thêm requestId, thêm stack khi dev.
// - Log đúng MỘT lần, ở đúng một chỗ (tầng biên): 5xx = lỗi của mình → error kèm Error object (có stack);
//   4xx = lỗi của client → warn ngắn gọn (không spam stack trace).
// - ensureError trước khi log → logger luôn nhận Error.
// - Factory nhận dependency (logger, isProduction) → test được, đổi logger dễ (P01).
// Trong NestJS: một @Catch() ExceptionFilter toàn cục (C06) + nestjs-pino (P01).
import { toErrorResponse } from './ex03.js';
import { ensureError } from './ex04.js';

export function createErrorHandler({ logger, isProduction = true }) {
  return function handle(error, { requestId } = {}) {
    const { statusCode, body } = toErrorResponse(error);
    const isServerError = statusCode >= 500;

    if (isServerError) {
      const err = ensureError(error);
      logger.error({ err, requestId });
      if (isProduction) body.message = 'Internal server error';
      else body.stack = err.stack;
    } else {
      logger.warn({ code: body.code, message: body.message, requestId });
    }

    if (requestId !== undefined) body.requestId = requestId;
    return { statusCode, body };
  };
}
