# C09 · Bài tập

Tiếp tục `shop-api` sau C08. Cài: `npm i @nestjs/config`. Chấm: `bash lessons/check.sh lessons/C09-configuration NN|all`. Bộ chấm **dựng lại ứng dụng với bộ biến môi trường sạch** cho từng ca (`jest.resetModules()`), nên cấu hình sai phải làm app **không khởi động được** (ở lúc nạp `AppModule` hoặc compile đều tính).

Biến môi trường (xem `CONTRACT.md` mục 5):

| Biến | Kiểu / luật | Mặc định (ngoài production) |
|---|---|---|
| `NODE_ENV` | `development \| test \| production` | `development` |
| `PORT` | nguyên `1..65535` | `3000` |
| `DATABASE_URL` | bắt đầu `postgres://` hoặc `postgresql://` | `postgres://postgres:postgres@localhost:5434/shop_dev` (`shop_test` khi `NODE_ENV=test`) |
| `REDIS_URL` | bắt đầu `redis://` hoặc `rediss://` | `redis://localhost:6380` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | chuỗi `>= 32` ký tự | giá trị dev cố định, **khác nhau** |
| `ADMIN_API_KEY` | chuỗi `>= 8` ký tự | `dev-admin-key` |
| `DEBUG_ENDPOINTS` | `true` hoặc `false` | `false` |
| `SHIPPING_FEE` | nguyên `>= 0` | `30000` |
| `FREE_SHIPPING_THRESHOLD` | nguyên `>= 0` | `500000` |

Biến đặt thành chuỗi rỗng coi như chưa đặt. Namespace `registerAs` (file ở `src/config/`): `app` (`appConfig`: `{ nodeEnv, port, isProduction }`), `database` (`databaseConfig`: `{ url }`), `redis` (`redisConfig`: `{ url }`), `auth` (`authConfig`: `{ accessSecret, refreshSecret, adminApiKey }`), `features` (`featuresConfig`: `{ debugEndpoints }`), `pricing` (`pricingConfig`: `{ shippingFee, freeShippingThreshold }`). Mỗi file `src/config/<tên>.config.ts` export hằng `<tên>Config`.

**Pass:** 7/8 bài, ≤ 2 hint.

---

## 🟢 Cơ bản

### ex01 · `ConfigModule` toàn cục và `.env.example`
- `AppModule` dùng `ConfigModule.forRoot({ isGlobal: true, ... })`; module bất kỳ inject được `ConfigService` mà không import `ConfigModule`.
- Tạo `.env.example` ở gốc `shop-api` liệt kê **đủ** các biến trên (dạng `KEY=value`) kèm chú thích; giá trị bí mật chỉ là chỗ giữ (`change-me...`).
- `.gitignore` chặn `.env` và `.env.*` nhưng giữ `!.env.example`.

### ex02 · `registerAs` có kiểu
- Sáu namespace như bảng trên, giá trị đã **đổi kiểu** (`port` là `number`, `debugEndpoints` là `boolean`; `'false'` không được thành `true`).
- Mặc định khi `NODE_ENV=test`: `app = { nodeEnv: 'test', port: 3000, isProduction: false }`, `pricing = { 30000, 500000 }`, `database.url` kết thúc `/shop_test`.
- Đọc được cả bằng `app.get('CONFIGURATION(app)')` (token `appConfig.KEY`) lẫn `ConfigService.get('app.port')`.

---

## 🟡 Kết hợp

### ex03 · Kiểm tra khi khởi động
- Truyền `validate` cho `ConfigModule.forRoot` (gợi ý: `class-validator` + `class-transformer`, hoặc Joi/Zod nếu bạn thích).
- Mọi vi phạm ở bảng trên làm app không lên và thông báo **nêu tên biến** (`PORT=abc/0/70000/30.5`, `NODE_ENV=staging`, `DATABASE_URL=mysql://...`, `REDIS_URL=http://...`, `DEBUG_ENDPOINTS=yes/1`, `SHIPPING_FEE=-1/1.5`...).
- Nhiều biến sai cùng lúc: thông báo liệt kê **tất cả**.

### ex04 · Production nghiêm ngặt
Khi `NODE_ENV=production`:
- Bắt buộc đặt `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_API_KEY`, `DATABASE_URL` (không có mặc định). Thiếu → lỗi nêu tên biến, nhiều biến thiếu → nêu hết.
- `JWT_*_SECRET` `>= 32` ký tự và **khác nhau**; `ADMIN_API_KEY` `>= 16` ký tự; `DEBUG_ENDPOINTS=true` bị cấm.
- `development`/`test`/không đặt `NODE_ENV` thì không bắt buộc biến nào.

### ex05 · Dùng config đã kiểm tra
- Ngoài `src/config/` (và `app.module.ts`, chỗ chọn file `.env`) không còn `process.env`. `main.ts` lấy cổng từ config.
- `ApiKeyGuard` nhận `authConfig` qua `@Inject(authConfig.KEY)`: test thay `authConfig.KEY` đổi được khóa. Khóa vẫn so bằng `timingSafeEqual`. Hành vi C07 giữ nguyên.
- Cập nhật spec Q01 của controller (nếu có) cho khớp constructor mới của guard.

### ex06 · `PricingModule.forRootAsync` từ cấu hình
`AppModule` cấu hình `PricingModule.forRootAsync({ isGlobal: true, inject: [...], useFactory })` từ `pricingConfig`: `SHIPPING_FEE` đổi phí ship, `FREE_SHIPPING_THRESHOLD` đổi ngưỡng (đúng ngưỡng thì miễn phí), mã giảm giá mặc định vẫn dùng được.

---

## 🔴 Thực tế

### ex07 · "Bí mật nằm trong log khởi động"
Kiểm toán: tìm thấy `JWT_ACCESS_SECRET` trong hệ thống log tập trung, vì có người in "config loaded" khi khởi động, và một thông báo lỗi echo cả chuỗi kết nối DB có mật khẩu.
- Thông báo lỗi cấu hình **không chứa giá trị** của bất kỳ biến nào (kể cả giá trị sai, chuỗi kết nối có mật khẩu).
- Khởi động thành công không ghi bí mật, host, hay mật khẩu vào bất kỳ log nào (`Logger` hay `console`).
- Production không bao giờ chấp nhận khóa admin mặc định (`dev-admin-key` gửi lên bị `401`); khóa đặt trong biến môi trường thì dùng được.
- `.env.example` không chứa chuỗi giống bí mật thật.

### ex08 · "Staging dùng nhầm file .env của dev"
Dev commit `.env.production` rồi staging đọc nhầm; ngoài ra không ai biết file nào thắng khi cùng khai báo một biến.
- Nạp theo thứ tự: biến môi trường thật > `.env.<NODE_ENV>.local` > `.env.<NODE_ENV>` > `.env`.
- Chỉ nạp file của môi trường **hiện tại** (file `.env.production` không ảnh hưởng khi `NODE_ENV=test`).
- Giá trị lấy từ file cũng qua kiểm tra (`SHIPPING_FEE=mien-phi` trong `.env.test` làm app không lên).

---

> 📏 Câu hỏi (không chấm): `ConfigService.get('app.port')` được gọi trong vòng nóng (mỗi request) có tốn không? Đo `config.get` 1 triệu lần so với đọc một hằng số, với `cache: true` và không có. Vì sao nên chuyển giá trị cấu hình vào thuộc tính của provider ở constructor thay vì gọi `get()` mỗi lần?
