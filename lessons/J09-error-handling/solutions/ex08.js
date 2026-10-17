// ex08 · parseJsonBody — đáp án best practice
//
// - Kiểm kích thước TRƯỚC khi parse (parse chuỗi khổng lồ tốn CPU và RAM — một kiểu tấn công DoS).
//   Đo bằng Buffer.byteLength (byte UTF-8), không phải .length (ký tự): 'đ' là 2 byte.
// - Bắt SyntaxError của JSON.parse và chuyển thành lỗi 400 có `cause` → client biết lỗi do họ,
//   log vẫn có chi tiết gốc.
// - Kiểm hình dạng sau khi parse: JSON hợp lệ chưa chắc là object.
// Trong NestJS: body parser của Express (limit: '1mb') + ValidationPipe làm việc này (C05, A06).
import { Buffer } from 'node:buffer';
import { AppError, ValidationError } from './ex02.js';

export function parseJsonBody(raw, { maxBytes = 1_000_000 } = {}) {
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
    throw new AppError('Payload too large', { code: 'PAYLOAD_TOO_LARGE', statusCode: 413 });
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (cause) {
    throw new ValidationError([{ field: 'body', message: 'Invalid JSON' }], 'Invalid JSON', { cause });
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new ValidationError([{ field: 'body', message: 'must be a JSON object' }]);
  }
  return data;
}
