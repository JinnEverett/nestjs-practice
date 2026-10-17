// ex05 · parseOrderInput — đáp án best practice
//
// - Thu thập lỗi vào mảng `errors` rồi ném MỘT lần → client sửa hết trong một lượt
//   (ValidationPipe của Nest cũng trả mọi lỗi cùng lúc).
// - Helper nhỏ isPositiveInt / isPlainObject có tên → điều kiện đọc như câu tiếng Việt.
// - Tên field theo đường dẫn 'items[0].qty' → frontend gắn lỗi đúng ô nhập.
// - Kết quả xây MỚI chỉ từ field được phép (allow-list) → field lạ như isAdmin không bao giờ lọt vào
//   (mass assignment — A06).
import { ValidationError } from './ex02.js';

const MAX_ITEMS = 50;
const MAX_NOTE = 500;
const isPositiveInt = (v) => Number.isSafeInteger(v) && v > 0;
const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);

export function parseOrderInput(input) {
  if (!isPlainObject(input)) throw new ValidationError([{ field: 'body', message: 'must be an object' }]);

  const errors = [];
  const { customerId, items, note } = input;

  if (!isPositiveInt(customerId)) errors.push({ field: 'customerId', message: 'must be a positive integer' });

  if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
    errors.push({ field: 'items', message: `must be an array of 1-${MAX_ITEMS} items` });
  } else {
    items.forEach((item, i) => {
      if (!isPlainObject(item)) {
        errors.push({ field: `items[${i}]`, message: 'must be an object' });
        return;
      }
      if (!isPositiveInt(item.productId)) errors.push({ field: `items[${i}].productId`, message: 'must be a positive integer' });
      if (!Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99) errors.push({ field: `items[${i}].qty`, message: 'must be an integer 1-99' });
    });
  }

  if (note !== undefined && (typeof note !== 'string' || note.trim().length > MAX_NOTE)) {
    errors.push({ field: 'note', message: `must be a string of at most ${MAX_NOTE} characters` });
  }

  if (errors.length > 0) throw new ValidationError(errors);

  return {
    customerId,
    items: items.map(({ productId, qty }) => ({ productId, qty })),
    note: note?.trim() || undefined,
  };
}
