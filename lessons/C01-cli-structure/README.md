# C01 · NestJS CLI và cấu trúc dự án

Đọc khoảng 12 phút. Từ module này bạn không còn viết hàm rời nữa: bạn dựng **`shop-api`**, dự án xuyên suốt cho đến hết khóa. Mỗi module sau thêm một lớp (validation, DB, auth, queue…) vào chính dự án này.

## Mục tiêu: sau buổi này bạn làm được
- Tạo dự án bằng Nest CLI, đọc hiểu cấu trúc thư mục và luồng khởi động (`main.ts` → `AppModule`).
- Phân biệt **module / controller / provider** và nối chúng bằng dependency injection.
- Dùng CLI sinh code (`nest g resource`), chạy chế độ watch và debug.
- Chạy được bộ chấm e2e của khóa học trên dự án của bạn.

---

## 1. Tạo `shop-api`
```bash
cd D:\Learning\Nestjs
npx @nestjs/cli@12 new shop-api --package-manager npm
```
CLI hỏi **module system**: chọn **`CJS (CommonJS) [ with jest ]`**. Lý do: toàn bộ khóa (kể cả bài chấm tự động) dùng Jest + supertest và import không cần đuôi `.js`. (ESM + Vitest cũng chạy được nhưng bài chấm không hỗ trợ.)
> Nest 12: các gói `@nestjs/*` là ESM-only, nhưng ứng dụng CommonJS vẫn dùng được nhờ `require(esm)` của Node ≥ 20.19/22.12; Jest chạy được trên Node ≥ 24.9. Máy bạn dùng Node 24 LTS nên ổn.

`nest new` tự `git init` bên trong `shop-api/`. Hãy commit sau mỗi module (`feat(C01): …`).

```
shop-api/
├── nest-cli.json         # cấu hình CLI (sourceRoot, compiler)
├── package.json          # script: start:dev, test, test:e2e ...
├── tsconfig.json         # strict, decorators (experimentalDecorators + emitDecoratorMetadata)
├── src/
│   ├── main.ts           # điểm khởi động: NestFactory.create(AppModule) → listen
│   ├── app.module.ts     # module gốc
│   ├── app.controller.ts # ví dụ (sẽ xóa)
│   └── app.service.ts    # ví dụ (sẽ xóa)
└── test/
    ├── app.e2e-spec.ts   # ví dụ e2e
    └── jest-e2e.json     # cấu hình Jest cho e2e
```

## 2. Ba khái niệm cốt lõi
```ts
@Injectable()                       // provider: lớp có thể được inject
export class ClockService { now() { return new Date(); } }

@Controller('ping')                 // controller: nhận request HTTP, ít logic
export class PingController {
  constructor(private readonly clock: ClockService) {}   // DI: Nest tự truyền instance
  @Get() ping() { return { pong: true, time: this.clock.now().toISOString() }; }
}

@Module({                           // module: gói các phần liên quan lại
  providers: [ClockService],
  exports: [ClockService],          // cho module khác dùng
})
export class ClockModule {}
```
- Controller chỉ làm: nhận input → gọi provider → trả output. Logic nghiệp vụ nằm trong provider (service).
- Provider mặc định là **singleton** trong một ứng dụng: mọi nơi inject đều nhận **cùng một instance**.
- Muốn dùng provider của module khác phải `imports: [OtherModule]` và module đó `exports` nó. (Bạn đã tự viết cơ chế này ở T07.)
- Nest đọc **metadata** do decorator ghi (`design:paramtypes`) để biết constructor cần gì — đúng như `mini-nest`.

## 3. Luồng khởi động
`main.ts` → `NestFactory.create(AppModule)` → dựng đồ thị module, tạo provider theo thứ tự phụ thuộc → gắn route → `app.listen(port)`.
Mọi cấu hình dùng chung (pipe toàn cục, prefix, CORS, shutdown hook…) nên gom vào **một hàm** để `main.ts` và **test e2e dùng chung**:

```ts
// src/app.setup.ts
export function configureApp(app: INestApplication): void {
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.enableShutdownHooks();
}
// src/main.ts
const app = await NestFactory.create(AppModule);
configureApp(app);
await app.listen(process.env.PORT ?? 3000);
```
Test e2e của khóa học tự gọi `configureApp(app)` nếu file `src/app.setup.ts` tồn tại — đây là **bề mặt ổn định** giữa code của bạn và bài chấm (xem `lessons/_shop-api/CONTRACT.md`).

## 4. CLI hữu ích
```bash
npm run start:dev                 # watch mode, tự restart khi sửa file
npm run start:debug               # = nest start --debug --watch, gắn debugger ở cổng 9229
nest g resource products          # sinh module + controller + service + dto + entity (chọn REST API, có CRUD entry points)
nest g module|controller|service <tên>   # sinh từng phần
npm run test:e2e                  # chạy e2e của dự án
```
VS Code: thêm cấu hình "Attach to Node" (port 9229) cho `start:debug`, đặt breakpoint trong controller và gọi `curl localhost:3000/ping`.

## 5. Vòng đời một request (nhìn trước)
```
request → middleware → guard → interceptor (trước) → pipe → CONTROLLER → interceptor (sau) → exception filter (nếu lỗi) → response
```
Từng khâu có module riêng: pipe (C05), filter (C06), middleware/guard (C07), interceptor (C08).

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Quên `@Injectable()` | `Nest can't resolve dependencies of X (?)` | gắn decorator, đăng ký trong `providers` |
| Đăng ký provider ở module A nhưng dùng ở B không `imports` | cùng lỗi trên | `exports` + `imports` |
| `new ClockService()` trong controller | bỏ qua DI, không override được khi test | inject qua constructor |
| Để logic trong controller | khó test, phình to | đẩy xuống service |
| Chọn ESM khi `nest new` | import cần `.js`, test dùng Vitest, bài chấm không chạy | tạo lại, chọn CJS |
| Hardcode cấu hình trong `main.ts` | e2e không thấy cấu hình | gom vào `configureApp` |

## Bên trong Nest dùng cái này ở đâu
- `ClockService` + override trong test là mô hình cho **mọi** dependency ngoài (DB, queue, thời gian, random): luôn inject để test thay được.
- `configureApp` là nơi sau này đặt `ValidationPipe` (C05), exception filter (C06), versioning (C02), Swagger (C11), Helmet (A06).
