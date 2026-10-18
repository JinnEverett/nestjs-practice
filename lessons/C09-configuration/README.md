# C09 · Configuration

Đọc khoảng 10 phút. Hiện giờ cấu hình rải khắp nơi (`process.env.ADMIN_API_KEY` trong guard, `process.env.PORT` trong `main.ts`, bảng giá hằng số). Module này gom về một chỗ: đọc từ môi trường, **kiểm tra lúc khởi động**, có kiểu, và test thay được. Cài: `npm i @nestjs/config`.

## Mục tiêu
- Dùng `ConfigModule.forRoot` (global), `.env` theo môi trường, `registerAs` để chia namespace.
- Kiểm tra biến môi trường khi khởi động và **fail fast**: sai cấu hình thì app không lên, không chạy sai âm thầm.
- Phân biệt mặc định an toàn cho dev với yêu cầu nghiêm ngặt ở production.
- Không để bí mật lọt vào log, thông báo lỗi hay git.

## 1. Nguyên tắc
Cấu hình là thứ **đổi theo môi trường mà không đổi code** (12-factor): cổng, URL DB, bí mật. Hằng nghiệp vụ hiếm khi đổi (tên trạng thái đơn) thì để trong code. Biến môi trường luôn là **chuỗi**; mọi chuyển kiểu phải tường minh.

## 2. `ConfigModule`
```ts
ConfigModule.forRoot({
  isGlobal: true,                     // inject ConfigService ở mọi module
  cache: true,
  envFilePath: [`.env.${env}.local`, `.env.${env}`, '.env'],   // trước = ưu tiên cao hơn
  load: [appConfig, databaseConfig, /* ... */],
  validate: (raw) => validateEnv(raw),                          // ném lỗi = không khởi động
})
```
Thứ tự ưu tiên (cao → thấp): **biến môi trường thật** > `.env.<NODE_ENV>.local` > `.env.<NODE_ENV>` > `.env` > mặc định trong code. Triển khai thật (Docker, CI) đặt biến môi trường; file `.env` chỉ cho máy dev. `forRoot()` chạy ngay khi file module được import, nên lỗi cấu hình nổi lên lúc nạp `AppModule`, trước khi có request đầu tiên.

## 3. `registerAs` và kiểu
```ts
export const authConfig = registerAs('auth', () => ({ accessSecret: env.JWT_ACCESS_SECRET, adminApiKey: env.ADMIN_API_KEY }));

constructor(@Inject(authConfig.KEY) private readonly auth: ConfigType<typeof authConfig>) {}   // có kiểu đầy đủ
config.get('auth.adminApiKey')        // cách khác, kiểu yếu hơn
```
Inject nguyên một namespace nhỏ tốt hơn rải `config.get('A_B_C')` khắp nơi: biết service cần gì, test thay bằng `overrideProvider(authConfig.KEY).useValue({...})`, và gõ sai tên là lỗi biên dịch.

## 4. Kiểm tra bằng schema
Dùng `class-validator` (đã có từ C05) hoặc Joi/Zod. Điểm cốt lõi:
- Chuyển kiểu rồi kiểm: `PORT` `'abc'`, `'0'`, `'70000'`, `'30.5'` đều sai; `DEBUG_ENDPOINTS` chỉ `'true'|'false'` (**không** `Boolean(v)`).
- Báo **tất cả** biến sai một lượt, để sửa một lần.
- **Không in giá trị** trong thông báo (có thể là bí mật gõ sai).
- Biến để trống (`PORT=`) coi như chưa đặt.
- Dev/test có mặc định an toàn; **production không có mặc định cho bí mật**: thiếu, quá ngắn (< 32), hai bí mật JWT trùng nhau, `DEBUG_ENDPOINTS=true`... đều dừng khởi động. Một app production chạy bằng bí mật mặc định công khai nguy hiểm hơn một app không chạy.

## 5. Bí mật
- `.gitignore`: `.env`, `.env.*`, nhưng giữ `!.env.example` (mẫu có chú thích, giá trị giữ chỗ).
- Không log cấu hình khi khởi động ("config loaded: {...}"). Không trả bí mật trong lỗi.
- Quay vòng bí mật (rotate) = đổi biến rồi restart; thiết kế để restart rẻ (P02 graceful shutdown).

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| `Boolean(process.env.DEBUG)` | `'false'` thành `true` | so sánh chuỗi tường minh |
| `Number(process.env.PORT)` không kiểm | `NaN` cổng | validate + `Number.isInteger` |
| `process.env.X` rải khắp code | không test được, không kiểm tra | chỉ đọc trong `src/config/` |
| Mặc định bí mật dùng được ở production | secret công khai trong repo | chỉ mặc định ngoài production |
| Chỉ báo lỗi đầu tiên | sửa-chạy-sửa-chạy | gom hết lỗi |
| Thông báo lỗi in giá trị | bí mật vào log tập trung | in tên biến + lý do |
| `.gitignore` chỉ có `.env` | `.env.production` bị commit | `.env.*` + `!.env.example` |
| Nghĩ `.env` ghi đè biến thật | deploy dùng nhầm | env thật luôn thắng file |

## Dùng ở đâu trong `shop-api`
Mọi module sau đọc config qua namespace: `databaseConfig` (B01 `TypeOrmModule.forRootAsync`), `redisConfig` (B07), `authConfig` (A02 JWT), `featuresConfig.debugEndpoints` (P05 `/_debug/loop`), `appConfig.port` (main). `PricingModule.forRootAsync` ở bài này là cùng mẫu với `JwtModule.registerAsync`, `BullModule.forRootAsync`. `.env.example` là tài liệu vận hành cho P07 (Docker, CI).
