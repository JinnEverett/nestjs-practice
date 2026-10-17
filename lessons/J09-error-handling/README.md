# J09 · Error handling

Đọc khoảng 10 phút.

## Mục tiêu: sau buổi này bạn làm được
- Đoán đúng luồng chạy của `try / catch / finally`, kể cả `return` trong `finally`.
- Thiết kế cây custom error có `code`, `statusCode`, `details`, `cause`.
- Biết khi nào **bắt** lỗi, khi nào **để lỗi đi tiếp**, và tuyệt đối không "nuốt" lỗi.
- Gom nhiều lỗi validate thành một lỗi có `details`; dùng `AggregateError`.
- Biến mọi lỗi thành HTTP response an toàn (không lộ chi tiết nội bộ) — tiền thân của Exception Filter trong NestJS.

---

## 1. `try / catch / finally`
```js
try {
  risky();
} catch (error) {        // có thể bỏ biến: catch { ... }
  handle(error);
} finally {
  cleanup();             // LUÔN chạy: dù try return, dù catch throw
}
```
- `finally` chạy **sau** khi giá trị `return` của `try` đã được tính, nhưng **trước** khi hàm thật sự trả về.
- `return` trong `finally` **ghi đè** return/throw của try/catch → không bao giờ `return` trong `finally`.

## 2. Ném cái gì?
- Luôn ném `Error` (hoặc lớp con) — có `stack`, `message`, `name`. `throw 'chuỗi'` không có stack, `instanceof Error` sai.
- Bọc lỗi giữ nguyên gốc: `throw new AppError('Không tải được hồ sơ', { cause: err })`. `cause` (ES2022) giúp log ra cả chuỗi nguyên nhân.
- Các lỗi có sẵn: `TypeError` (sai kiểu), `RangeError` (giá trị ngoài khoảng), `SyntaxError` (JSON.parse), `AggregateError` (nhiều lỗi).

## 3. Custom error
```js
class AppError extends Error {
  constructor(message, { code = 'INTERNAL_ERROR', statusCode = 500, details, cause } = {}) {
    super(message, { cause });
    this.name = new.target.name;   // 'NotFoundError' cho lớp con, không cần gán tay ở mỗi lớp
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}
class NotFoundError extends AppError { /* code NOT_FOUND, 404 */ }
```
- `code` cho **máy** đọc (client switch theo code), `message` cho **người** đọc.
- Đừng phân loại lỗi bằng cách so `error.message` — message đổi là vỡ.

## 4. Bắt ở đâu?
| Tầng | Làm gì với lỗi |
|---|---|
| Hàm tiện ích / domain | **ném** lỗi có ý nghĩa, không bắt |
| Service gọi hạ tầng (DB, HTTP) | bắt lỗi kỹ thuật → bọc thành lỗi có ngữ cảnh (`cause`), hoặc để đi tiếp |
| Biên ngoài cùng (handler HTTP / exception filter) | bắt **mọi thứ**, log, map sang response |

**Nuốt lỗi** (`catch (e) { console.log(e); return null; }`) là bug: caller tưởng thành công, lỗi biến mất khỏi monitoring.

## 5. Không lộ thông tin nội bộ
Lỗi 5xx (bug, DB sập) → client chỉ nhận `{ code: 'INTERNAL_ERROR', message: 'Internal server error' }`; chi tiết + stack vào **log** kèm `requestId` để tra. Lỗi 4xx (client gửi sai) → trả message và `details` cụ thể.

## 6. Error và JSON
`JSON.stringify(new Error('x'))` → `'{}'` vì `message`, `stack` không enumerable. Muốn serialize → định nghĩa `toJSON()` hoặc tự chọn field.

## Bẫy hay gặp
| Bẫy | Hậu quả |
|---|---|
| `catch (e) { return null; }` | lỗi biến mất, dữ liệu sai lan tiếp |
| `throw new Error(e.message)` | mất stack và loại lỗi gốc → dùng `cause` |
| `return` trong `finally` | nuốt luôn lỗi đang được ném |
| Trả `err.message` của lỗi DB ra client | lộ tên bảng, câu SQL |
| `if (e.message === 'not found')` | vỡ khi message đổi → dùng `instanceof` / `code` |

## Bên trong NestJS dùng cái này ở đâu
- `HttpException`, `NotFoundException`, `BadRequestException`… là cây custom error (C06).
- Exception filter toàn cục = `createErrorHandler` ở ex09.
- `ValidationPipe` ném `BadRequestException` với danh sách lỗi từng field — giống ex05.

## Bài tập
Xem `exercises.md`. Chấm: `bash lessons/check.sh lessons/J09-error-handling NN`.
