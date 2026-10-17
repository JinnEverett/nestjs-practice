// ex03 · toErrorResponse — đáp án best practice
//
// - Phân loại bằng `instanceof AppError` (không tin object bất kỳ có field statusCode — có thể là
//   dữ liệu từ thư viện/ngoài vào).
// - Lỗi không biết = lỗi lập trình/hạ tầng → luôn 500 với message chung; chi tiết để dành cho log.
// - Body là object mới, chỉ có field được phép.
import { AppError } from './ex02.js';

const INTERNAL = Object.freeze({ code: 'INTERNAL_ERROR', message: 'Internal server error' });

export function toErrorResponse(error) {
  if (error instanceof AppError) {
    const { statusCode, code, message, details } = error;
    return { statusCode, body: { code, message, ...(details !== undefined && { details }) } };
  }
  return { statusCode: 500, body: { ...INTERNAL } };
}
