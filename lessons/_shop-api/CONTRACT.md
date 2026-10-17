# Hợp đồng của `shop-api`

Tài liệu này là **nguồn sự thật chung** cho mọi bài Tier C trở đi: người soạn bài, bài chấm e2e và đáp án (overlay) đều phải khớp.
Khi thêm/sửa bề mặt công khai (route, file, token) hãy cập nhật ở đây **trước**.

## 1. Bề mặt ổn định giữa code người học và bài chấm

Bài chấm (e2e) chỉ được dựa vào:

| Thứ | Đường dẫn / tên | Từ module |
|---|---|---|
| Module gốc | `src/app.module.ts` → `export class AppModule` | scaffold |
| Cấu hình chung main + test | `src/app.setup.ts` → `export function configureApp(app: INestApplication): void | Promise<void>` | C01 |
| Các file/tên **được nêu rõ trong `exercises.md`** của chính bài đó | | |

Bài chấm **không** giả định thêm cấu trúc thư mục nào khác. Mọi thứ cần import (service, token, entity…) phải được `exercises.md` chỉ định chính xác đường dẫn và tên export.
Testkit (`lessons/_shop-api/testkit/*.ts`, copy vào `shop-api/test/_checks/` lúc chấm): `createTestApp({ customize })`, `http(app)`, `sleep`, `fileExists`, `readSource`, `repoPath` — xem `_kit.ts`. Các helper DB/Redis/log thêm dần ở `_db.ts`, `_redis.ts`, `_logs.ts` (người soạn module đầu tiên cần helper đó tạo file và ghi vào mục 7).

## 2. Quy ước chạy
- Node 24 LTS, Nest 12 **CJS + Jest** (`nest new … ` chọn CJS), TypeScript strict, `tsc --noEmit` phải sạch trước khi e2e chạy.
- Chấm: `bash lessons/check.sh lessons/<ID>-<slug> <NN|all>` (người học) / `… --solutions` (coach). Trước khi e2e chạy, `e2e.sh` copy `checks/exNN.e2e-spec.ts` + testkit vào `shop-api/test/_checks/`, rồi xóa sau khi xong.
- **Overlay**: `solutions/` của module = cây thư mục tương đối với `shop-api/` (vd. `solutions/src/orders/orders.service.ts`). Áp dụng tích lũy theo `_shop-api/ORDER.md`. File `solutions/DEPS` khai báo gói cần cài (`dependencies|dev  tên@range`, phiên bản lấy ở `VERSIONS.md`). File `*.md` ở gốc `solutions/` bị bỏ qua (dùng cho ghi chú). Overlay **ghi đè** file cùng tên của module trước, nên module sau phải ghi lại **toàn bộ** nội dung của file nó sửa.
- Bài đoán (🔮): lời đoán của người học ở `lessons/<bài>/answers/exNN.txt`; e2e.sh copy vào `test/_checks/answers/`. Đáp án mẫu ở `solutions/_answers/exNN.txt` (lấy từ output thật).
- Bài cần database: tạo file rỗng `checks/.needs-db`; cần Redis: `checks/.needs-redis`. `e2e.sh` tự bật container. Chạy tuần tự (`--runInBand`).
- Check chạy trên **trạng thái ngay sau module đó**; module sau có thể phá check của module trước (guard toàn cục, envelope…): bình thường.
- Không gọi dịch vụ ngoài internet. OAuth provider, cổng thanh toán, SMTP, S3… giả lập bằng server `http` nhỏ dựng trong chính check (hoặc MinIO tùy chọn).

## 3. Miền nghiệp vụ (bám dataset `shop` của workspace Sql)

ID trong API là **số nguyên** (`integer`, không phải chuỗi/bigint) để dễ test. Thời gian là ISO 8601 UTC (`2026-10-17T08:00:00.000Z`). **Tiền là số nguyên VND** (không có phần lẻ) trong API và trong DB (`numeric(12,0)` hoặc `integer`; bài R09 bàn kỹ về tiền).

| Thực thể | Trường (API) |
|---|---|
| Category | `id, parentId|null, name, slug` |
| Product | `id, categoryId, sku (^[A-Z0-9-]{3,20}$, duy nhất), name (1..120), brand|null, price (int ≥ 0), stock (int ≥ 0), attributes (object), isActive (bool), createdAt` |
| User | `id, email (duy nhất, lowercase), fullName, role ('customer'|'admin'), createdAt` — **không bao giờ** có `passwordHash` trong response |
| Order | `id, userId, status ('pending'|'paid'|'shipped'|'delivered'|'cancelled'|'refunded'), items[{productId, quantity, unitPrice}], shippingFee, discountCode|null, discountAmount, totalAmount, createdAt, updatedAt` với `totalAmount = Σ(unitPrice × quantity) + shippingFee − discountAmount` |
| Payment | `id, orderId, method ('card'|'ewallet'|'bank_transfer'|'cod'), status ('succeeded'|'failed'|'refunded'), amount, createdAt` |

Quy tắc giá (từ C03): phí ship `30000`, miễn phí khi tổng tiền hàng ≥ `500000`. Mã giảm giá cấu hình sẵn: `WELCOME10` (−10%, tối đa 100000, đơn tối thiểu 200000), `FREESHIP` (miễn phí ship). Giá lấy từ sản phẩm **tại thời điểm đặt** (`unitPrice`), không tin giá client gửi.

## 4. Quy ước API
- Tiền tố phiên bản **URI**: `/v1/...` (C02). Ngoại lệ không phiên bản: `/ping`, `/health/*`, `/docs`, `/docs-json`, `/metrics`, `/_debug/*`.
- Lỗi (từ C06): `Content-Type: application/problem+json`, thân `{ type, title, status, detail, instance, errors? }`, trong đó `type` là `urn:shop:error:<kebab-code>` (vd. `urn:shop:error:out-of-stock`, `urn:shop:error:validation`). Lỗi 5xx không lộ chi tiết nội bộ.
- Phân trang danh sách (từ C02/C11): query `page` (≥1, mặc định 1), `limit` (1..100, mặc định 20), `sort` (`field` hoặc `-field`); phản hồi `{ data: [...], meta: { page, limit, total } }`. Keyset (B04): `cursor`, phản hồi `{ data, meta: { nextCursor|null } }`.
- Status code: `201` + `Location` khi tạo; `204` khi xóa; `404` không tìm thấy; `409` xung đột (trùng SKU, hết hàng); `422` vi phạm quy tắc nghiệp vụ; `400` dữ liệu sai; `401` chưa xác thực; `403` không đủ quyền.
- Header: `X-Request-Id` (C07) trên mọi response.
- Xác thực (từ A02): `Authorization: Bearer <jwt>`; route công khai gắn `@Public()`; trước A02 các route ghi dùng `X-Api-Key` (C07).

## 5. Dữ liệu và hạ tầng
- Trước B01: dữ liệu **trong bộ nhớ** (repository in-memory). Từ B01: Postgres `nest-practice-pg` cổng **5434**, DB `shop_dev` (chạy tay), `shop_test` (check), `shop_xs/s/m` (B03). `DATABASE_URL` mặc định cho test: `postgres://postgres:postgres@localhost:5434/shop_test`. Test dùng `synchronize` hoặc chạy migration (B03+); `_db.ts` có `resetDatabase(app)`.
- Redis `localhost:6380` (từ B07), RabbitMQ `5673` (profile `broker`, Tier M).
- Cấu hình qua env (C09): `PORT`, `NODE_ENV`, `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ADMIN_API_KEY`, `DEBUG_ENDPOINTS`. Giá trị mặc định chỉ cho `NODE_ENV !== 'production'`.

## 6. Bản đồ module → thứ được thêm (tóm tắt, chi tiết nằm ở `exercises.md` từng bài)

| Module | Thêm vào `shop-api` |
|---|---|
| C01 | `GET /ping`, `src/app.setup.ts`, `ClockModule/ClockService`, `ProductsModule` (stub CLI) |
| C02 | Products CRUD in-memory: `/v1/products` (+ phân trang, sort, lọc `brand`/`minPrice`/`maxPrice`/`q`), `GET /v1/p/:sku` (302), versioning URI (v1 + `GET /v2/products` trả envelope), route wildcard |
| C03 | `ProductsRepository` (token `PRODUCTS_REPOSITORY`), `PricingService`, `/v1/orders` in-memory (tính tiền), provider `useValue/useClass/useFactory/useExisting`, `@Optional`, `forwardRef` |
| Q01 | Unit test mẫu (`*.spec.ts`) cho 3 service — người học viết; overlay có test tham chiếu |
| C04 | Tách `ProductsModule`, `OrdersModule`, `PricingModule.forRoot/forRootAsync`, `SharedModule` `@Global`, `ConfigurableModuleBuilder` |
| C05 | DTO + `ValidationPipe` toàn cục (trong `configureApp`), `ParseIntPipe`, pipe tự viết, DTO lồng, `PartialType` |
| C06 | Filter toàn cục `problem+json`, lỗi domain (`ProductNotFoundError`, `OutOfStockError`, `DuplicateSkuError`) |
| C07 | `RequestIdMiddleware`, middleware log, `ApiKeyGuard` (+ `@UseGuards` ở route ghi) |
| C08 | Interceptor (log, timeout, cache GET), decorator tự viết (`@ReqId()`, `@AdminOnly()`), `GET /v1/_trace` hiển thị thứ tự lifecycle |
| C09 | `@nestjs/config`, validate env, `registerAs`, `ConfigService` có kiểu |
| C10 | Lifecycle hooks, async provider, scope REQUEST/TRANSIENT, `ModuleRef`, lazy module |
| C11 | Swagger `/docs`, `/docs-json`, CLI plugin, envelope phân trang chuẩn, header `Deprecation/Sunset` |
| C12 | Upload ảnh sản phẩm (Multer), tải ảnh bằng `StreamableFile`, `GET /v1/exports/products.csv` stream |
| B01 | TypeORM + entity Product/Category/User/Order/OrderItem/Payment, repository thật, `_db.ts` |
| Q02 | Mẫu e2e DB sạch (schema/ truncate), chạy 3 lần ổn định |
| B02 | Quan hệ, `include=items`, đếm query (`QueryCounter` trong `_db.ts`) |
| B03 | Migration + `npm run seed -- --scale xs|s|m`, `shop_xs/s/m` |
| B04 | QueryBuilder, báo cáo `GET /v1/reports/top-products`, keyset `cursor` |
| B05 | Transaction đặt hàng, `@VersionColumn`, khóa bi quan, retry deadlock, transaction qua CLS |
| B06 | Tách domain/entity/mapper, repository interface |
| B07 | Cache Redis (`GET /v1/products/:id`), invalidation, chống stampede |
| A01 | `UsersModule`, `POST /v1/auth/register`, `POST /v1/auth/login` (argon2), `@Exclude` hash |
| A02 | JWT access/refresh + rotation + reuse detection, `JwtAuthGuard` toàn cục + `@Public()` |
| A03 | Cookie/session variant, CSRF |
| A04 | `@Roles()`, `RolesGuard`, kiểm tra sở hữu (chống IDOR), CASL (tùy chọn) |
| A05 | OAuth2/OIDC authorization code + PKCE (provider giả trong test) |
| A06 | Helmet, CORS allowlist, Throttler, giới hạn body, rà OWASP API |
| P01 | `nestjs-pino`, log JSON, requestId bằng CLS, redact |
| P02 | `/health/live`, `/health/ready` (Terminus), graceful shutdown |
| P03 | BullMQ (`emails`, `order-expiry`), retry/backoff, idempotent, `@nestjs/schedule` |
| P04 | Adapter Fastify (tùy chọn qua cấu hình), compression, ETag/Cache-Control |
| P05 | `/_debug/loop` (khi `DEBUG_ENDPOINTS=true`), kịch bản bench, `review.md` thí nghiệm |
| P06 | Công cụ profiling, bài tìm leak/hot path |
| P07 | `Dockerfile`, `.dockerignore`, `docker-compose.prod.yml`, `.github/workflows/ci.yml` |
| P08 | `/metrics` (Prometheus RED), OpenTelemetry tracing |
| P09 | `ResilientHttpClient` (timeout/retry/circuit breaker/bulkhead) |
| R01 | Danh sách an toàn: whitelist filter/sort/search, cursor, tổng số tùy chọn |
| R02 | `Idempotency-Key` cho `POST /v1/orders/:id/payments` |
| R03 | Presigned URL, xử lý ảnh qua queue, dọn file mồ côi |
| R04 | Email qua queue + outbox nhẹ |
| R05 | Nhận/gửi webhook (HMAC, idempotent, retry) |
| R06 | Multi-tenancy (tenant id qua guard + CLS, RLS) |
| R07 | Audit log + soft delete |
| R08 | 3 bug concurrency (oversell, double charge, counter) |
| R09 | Tiền (decimal), timezone, i18n |
| R10 | Tìm kiếm Postgres (tsvector, unaccent, pg_trgm) |
| M01 | Ranh giới module, dependency rule, DDD-lite |
| M02 | Domain events (`@nestjs/event-emitter`) |
| M03 | CQRS (`@nestjs/cqrs`) |
| M04 | WebSocket gateway, SSE |
| M05 | GraphQL + DataLoader |
| M06 | Microservices (RabbitMQ) |
| M07 | gRPC |
| M08 | Outbox + idempotent consumer + saga |
| M09 | Monorepo/shared lib |
| CAP | Hoàn thiện, Docker + CI + báo cáo bench |

## 7. Sổ đăng ký testkit (cập nhật khi thêm helper)

| File | Export | Thêm bởi |
|---|---|---|
| `_kit.ts` | `createTestApp, http, sleep, fileExists, readSource, repoPath` | hạ tầng |

> Người soạn module thêm helper mới: tạo file `_shop-api/testkit/_<tên>.ts`, ghi vào bảng trên, và **không** đổi chữ ký các export cũ.
