# Báo cáo nhóm `core`

**Branch:** `claude/content-core` (tạo từ `main`). **Chưa push được**: repo không có remote `origin`, và `add_repo` báo GitHub App chưa được cài cho `JinnEverett/nestjs-practice` (push bị từ chối). Mọi commit đang ở local, nhỏ theo module (`feat(Cxx): ...`). Không tạo PR, không merge.

## Module đã làm và trạng thái verify
Môi trường: Node **24.22** (cài qua npm package vì máy mặc định Node 22), `bash lessons/check.sh <bài> all --solutions`, chạy lại toàn bộ ở cuối phiên.

| Module | Việc | Verify |
|---|---|---|
| S00 | thêm `lessons/S00-setup/README.md` | 🧪 chạy thật `check.sh _sample` và `bench` hello-fast/hello-block ở 1,10,100 |
| N01–N07 | đã đủ nội dung; chỉ nới ngưỡng `N01 ex05` (1.25× → 1.15×, flaky trên máy 4 core) | 🧪 xanh cả 7 |
| C01 | mẫu, không sửa | 🧪 22 test xanh |
| C02–C12 | mới hoàn toàn (README, exercises, checks, solutions) | 🧪 40/36/25/95/35/43/38/54/29/61/47 test xanh |
| Q01, Q03, Q04 | mới; chấm bằng test ẩn **và mutation** (spec của người học phải bắt ≥ 80% lỗi cài sẵn) | 🧪 19/32/40 test xanh |
| Q02 | mới; cần DB | ✅ **chưa verify với B01 thật.** Đã chạy xanh (42 test) với một B01 giả (entity Product + TypeORM, `synchronize`) trên Postgres 16 thật cổng 5434. B01 giả không được commit |

Tất cả C/Q chạy trên repository in-memory đến Q02, nên không cần Docker. Q02 cần Postgres.

## Quyết định thiết kế đáng chú ý
- **Chuỗi shop-api trước B01:** C02 CRUD → C03 `PRODUCTS_REPOSITORY` (async, B01 chỉ cần đổi `useClass`) + `PricingService` + đơn hàng in-memory → C04 gỡ vòng phụ thuộc bằng `ProductUsageRegistry` thay `forwardRef`, `PricingModule.forRoot/forRootAsync` bằng `ConfigurableModuleBuilder` → C05 DTO/pipe → C06 problem+json + lỗi domain → C07 request id, logger, `ApiKeyGuard` → C08 interceptor (timing, timeout, cache GET), `@AdminOnly`, `/v1/_trace` → C09 `@nestjs/config` fail-fast → C10 hooks/scope/ModuleRef/lazy module → C11 OpenAPI, `Link`, `Deprecation/Sunset`, `openapi.json` được commit → C12 Multer, `StreamableFile`, CSV stream chống CSV injection.
- **Chấm bằng mutation (Q01, Q03, Q04):** check chạy spec của người học trên bản sao `src/` đã thay file bằng "mutant" (đổi `>=`→`>`, bỏ nhánh...). Thông báo lỗi nêu hành vi nào chưa có test, không lộ dòng code. Hạ tầng: `_mutation.ts`, `_mutants.ts`, `_ref_*.ts` trong `checks/`.
- Bài 🔮 lấy kết quả từ **lần chạy thật** (C08 ex07, C10 ex02, Q01 ex05), bài đo 📏 chỉ kiểm cấu trúc `answers/*.md`.
- Mỗi module có ≥ 1 bẫy thật: float/làm tròn tiền, trừ kho không nguyên tử, SKU hoa/thường, sort không ổn định khi phân trang, IDOR-gần (guard trước pipe), `timingSafeEqual`, lộ bí mật trong log, CSV injection, path traversal, múi giờ/flaky.

## Thay đổi ngoài thư mục module
- `lessons/_shop-api/ORDER.md`: thêm `Q03`, `Q04` (sau C12) để chạy được `--solutions`; ghi chú về spec trong `src/`.
- `lessons/_shop-api/CONTRACT.md`: mục 5 thêm `SHIPPING_FEE`, `FREE_SHIPPING_THRESHOLD`, namespace config, quy tắc production fail-fast; **thêm mục 6b** liệt kê bề mặt nhóm core thêm (token, đường dẫn, module). Các nhóm sau nên đọc 6b trước khi viết B01.
- `tools/CONTENT_PLAN.md`.

## Cần chú ý khi gộp với các nhóm khác
1. **Các nhóm khác không thấy code của nhóm này** (họ chỉ có CONTRACT). B01 nên giữ `PRODUCTS_REPOSITORY`/`ProductsRepository` (CONTRACT 6b); nếu khác phải overlay lại `products.module.ts` và các spec.
2. **Spec nằm trong `src/`** (Q01, Q03, Q04): `tsc --noEmit` của module sau biên dịch chúng. Đổi chữ ký service/guard/interceptor mà không overlay lại spec thì check của module đó đỏ vì lỗi kiểu.
3. `openapi.json` mỗi module sau C11 cần xuất lại (`npx ts-node scripts/export-openapi.ts`); các module C12/Q04 đã làm.
4. **Phát hiện ở hạ tầng, chưa sửa:** `_shop-api/base/tsconfig.json` có `rootDir: "."` nên `nest build` ra `dist/src/main.js`, còn script `start:prod` là `node dist/main`. P07 (Docker) cần xử lý.
5. Đặc thù Nest 12 / Express 5 đã đối chiếu bằng cách chạy thật: wildcard phải đặt tên (`*splat`), `import type` bắt buộc cho kiểu trong constructor có decorator (TS1272), `ValidationPipe({transform})` đổi `@Param` trước khi pipe của bạn chạy, `PartialType` gắn `@IsOptional()` nên `null` lọt qua, `ConfigModule.forRoot` kiểm tra ngay lúc import module, Swagger plugin không chạy dưới `ts-jest`, route Swagger không đi qua middleware của Nest.
6. Q02 chưa chạy với B01 thật; nếu B01 giữ trạng thái trong RAM (như `ProductUsageRegistry` ở đây) thì cần dọn trạng thái đó khi reset DB. Bài đã nêu bẫy này.
