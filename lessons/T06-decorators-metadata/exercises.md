# T06 · Bài tập

Viết vào `answers/exNN.ts`, đầu file `import 'reflect-metadata';` khi dùng `Reflect.*Metadata`.
Chấm: `bash lessons/check.sh lessons/T06-decorators-metadata 01`. Đáp án: `solutions/`.

**Pass:** 6/8 bài, `tsc` sạch, dùng ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · Class decorator
- `Entity(table: string): ClassDecorator` — ghi tên bảng vào metadata; `getTableName(cls)` đọc lại, class chưa được đánh dấu → `Error`
- `Sealed: ClassDecorator` (không phải factory) — `Object.seal` cả class lẫn `prototype` (thêm static/method mới lúc chạy → TypeError)

### ex02 · Method decorator bọc hàm
- `Measure(sink: (label: string, ms: number) => void)` — gọi `sink('<TênClass>.<method>', ms)` sau mỗi lần gọi; method `async` thì đo tới khi Promise settle; lỗi vẫn đo và ném lại
- `Memoize()` — nhớ kết quả theo **tham số đầu tiên**, **riêng từng instance**, nhớ cả `undefined`
Cả hai giữ `this` và giá trị trả về.

### ex03 · Property decorator + `design:type`
`Column(options?: { type?: 'string' | 'number' | 'boolean' | 'date'; nullable?: boolean })`:
- không có `type` → suy từ `design:type` (`String/Number/Boolean/Date`); không suy được (vd. mảng, `string | null`) → `TypeError` **ngay khi định nghĩa class**
- `getColumns(cls)` → `[{ property, type, nullable }]`: cột của **lớp cha trước**, rồi lớp con, theo thứ tự khai báo; `nullable` mặc định `false`

---

## 🟡 Kết hợp

### ex04 · Parameter decorator + `design:paramtypes`
- `Injectable(): ClassDecorator` (để TS phát `design:paramtypes`)
- `Inject(token: string | symbol | Function): ParameterDecorator` — chỉ dùng cho tham số constructor (dùng ở method → `TypeError`)
- `getDependencies(cls)` → mảng token cho từng tham số constructor: token của `@Inject` nếu có, ngược lại kiểu từ `design:paramtypes`. Tham số không xác định được (kiểu là `Object` — interface/kiểu literal — mà không có `@Inject`) → `Error` có tên class và vị trí tham số.

### ex05 · Metadata class + method, ghi đè
- `Roles(...roles: string[])` và `Public()` dùng được **cả trên class lẫn method**
- `getRoles(cls, method)` → roles của method nếu có, không thì của class (kể cả kế thừa), không thì `[]`
- `isPublic(cls, method)` tương tự, mặc định `false`

### ex06 · Validation decorators (class-validator mini)
Property decorator: `IsString()`, `IsEmail()`, `Min(n)`, `Max(n)`, `IsOptional()`. `validate(obj)` → mảng lỗi `[{ property, constraint, message }]` (`constraint`: `'isString' | 'isEmail' | 'min' | 'max'`), duyệt property theo thứ tự khai báo (lớp cha trước), mỗi property chạy rule theo thứ tự xuất hiện. `IsOptional` + giá trị `null/undefined` → bỏ qua mọi rule của property đó.

---

## 🔴 Thực tế

### ex07 · `@Retry` và `@Timeout`
Cho method `async`:
- `Retry({ times, delayMs = 0 })` — reject thì gọi lại tối đa `times` lần nữa (chờ `delayMs` giữa các lần)
- `Timeout(ms)` — quá `ms` → reject lỗi `name === 'TimeoutError'`; settle sớm thì `clearTimeout`
Thứ tự quan trọng: `@Retry @Timeout m()` = **mỗi lần thử** có timeout riêng; `@Timeout @Retry m()` = timeout cho **toàn bộ** các lần thử. Giữ `this`.

### ex08 · Router decorator (Nest mini)
`Controller(prefix = '')`, `Get(path = '')`, `Post(path = '')`, `Put(path = '')`, `Delete(path = '')`. `getRoutes(controllers)` → `[{ method, path, controller, handler }]`:
- `path` = prefix + path, đúng một `/` giữa các phần, bắt đầu bằng `/`, không có `/` cuối (trừ `'/'`)
- theo thứ tự controller rồi thứ tự khai báo method
- class thiếu `@Controller` → `Error`; trùng (method + path) → `Error` nhắc path
