# C10 · Lifecycle, scopes và ModuleRef

Đọc khoảng 12 phút. Provider không chỉ "được tạo": nó có **vòng đời** (khởi tạo → sẵn sàng → tắt), một **scope** (sống bao lâu, dùng chung với ai) và đôi khi cần được lấy **động** lúc chạy. Hiểu ba điều này tránh được ba loại sự cố: kết nối mở không đóng, request chậm bất thường vì scope, và module nặng làm khởi động lâu.

## Mục tiêu
- Dùng đúng 5 lifecycle hook, biết thứ tự khởi tạo và thứ tự tắt (ngược lại).
- Viết provider bất đồng bộ (`useFactory: async`) và hiểu Nest chờ nó.
- Phân biệt scope `DEFAULT`, `REQUEST`, `TRANSIENT`; hiểu scope REQUEST "nổi" lên theo cây phụ thuộc và chi phí của nó.
- Dùng `ModuleRef` (`get`, `resolve`, `ContextIdFactory`) và `LazyModuleLoader`.

## 1. Lifecycle hooks
```
constructor → [chờ provider async] → onModuleInit → onApplicationBootstrap → (chạy) →
onModuleDestroy → beforeApplicationShutdown → [đóng HTTP server] → onApplicationShutdown
```
| Hook | Dùng cho |
|---|---|
| `onModuleInit` | mở kết nối, nạp dữ liệu nền (có thể `async`, Nest **chờ**) |
| `onApplicationBootstrap` | việc cần mọi module đã sẵn sàng (đăng ký job, warm cache) |
| `onModuleDestroy` / `beforeApplicationShutdown` | ngừng nhận việc mới, chờ việc đang chạy |
| `onApplicationShutdown(signal)` | đóng kết nối, flush log |

- Thứ tự khởi tạo theo đồ thị phụ thuộc (dependency trước). Thứ tự tắt là **ngược lại**: `Service` đóng trước `Db` để `Service` không còn dùng một `Db` đã đóng.
- `onApplicationShutdown` chỉ chạy khi gọi `app.close()` hoặc khi nhận tín hiệu **và** có `app.enableShutdownHooks()` (đã có trong `configureApp` từ C01). Không có thì SIGTERM giết process ngay, kết nối rò.
- Chủ tài nguyên dọn tài nguyên: provider mở kết nối cũng là provider đóng nó.

## 2. Provider bất đồng bộ
```ts
{ provide: BROKER, inject: [LifecycleJournal], useFactory: async (j) => { const c = await connect(); return c; } }
constructor(@Inject(BROKER) private readonly broker: Broker) {}     // nhận Broker, KHÔNG phải Promise<Broker>
```
Nest chờ factory trước khi dựng provider phụ thuộc và trước mọi `onModuleInit`. Factory ném lỗi thì ứng dụng **không khởi động** (đúng ý muốn: thà không lên còn hơn lên mà thiếu kết nối). Khác với hook `onModuleInit`: factory dùng khi giá trị phải sẵn sàng **lúc inject**.

## 3. Scope
| Scope | Instance | Dùng khi |
|---|---|---|
| `DEFAULT` | một cho cả ứng dụng | hầu hết mọi thứ |
| `REQUEST` | một **cho mỗi request** | cần dữ liệu theo request (`@Inject(REQUEST)`), multi-tenant (R06) |
| `TRANSIENT` | một **cho mỗi nơi inject** | trạng thái riêng cho từng consumer (logger có context) |

Quy tắc quan trọng: scope REQUEST **nổi lên** theo cây. Ai phụ thuộc vào provider REQUEST cũng thành REQUEST, kể cả controller, nên cả nhánh bị dựng lại mỗi request. TRANSIENT thì **không** nổi: singleton giữ một instance transient riêng suốt đời. Bài này đếm constructor để bạn thấy: 5 request → 5 lần dựng `RequestScopedService` và `ConsumerB`, 0 lần dựng `SingletonService` và `ConsumerA`.

Chi phí: dựng lại cây mỗi request tốn CPU và GC (đo ở ex08). Cách tốt hơn để có "dữ liệu theo request": param decorator `@ReqId()` (C08), `AsyncLocalStorage`/`nestjs-cls` (P01, B05), hoặc truyền tham số. Chỉ dùng REQUEST scope khi các cách đó không đủ.

## 4. `ModuleRef`
```ts
constructor(private readonly moduleRef: ModuleRef) {}
this.moduleRef.get(Service, { strict: false })               // singleton, đồng bộ
await this.moduleRef.resolve(RequestScopedService)           // scoped: mỗi lần gọi một instance mới
const ctx = ContextIdFactory.create();
await this.moduleRef.resolve(RequestScopedService, ctx)       // cùng ctx → cùng instance (giống "một request")
```
`get()` trên provider REQUEST/TRANSIENT bị từ chối; dùng `resolve()`. Ngoài HTTP, `REQUEST` là `undefined`: provider nên viết sao chịu được. `ModuleRef` hợp cho strategy chọn lúc chạy (chọn cổng thanh toán theo `method`), tránh vòng phụ thuộc, hoặc lấy provider từ code không thuộc DI.

## 5. Module nạp lười
```ts
const moduleRef = await this.lazyLoader.load(() => ReportsModule);   // lần đầu dựng, lần sau dùng lại
moduleRef.get(ReportsService).summary();
```
Dùng cho phần nặng, hiếm dùng (báo cáo, export, CLI), hoặc serverless để giảm cold start. Module lười **không** được import tĩnh ở nơi khác (nếu không nó nạp ngay). Đổi lại, lỗi cấu hình của module đó chỉ lộ ra ở lần gọi đầu.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Mở kết nối ở constructor | không chờ được, lỗi không dừng khởi động | `onModuleInit`/provider async |
| Quên `enableShutdownHooks` | SIGTERM không chạy hook, rò kết nối | bật trong `configureApp` |
| Dọn tài nguyên ở nơi không sở hữu nó | đóng hai lần / không đóng | chủ sở hữu tự đóng |
| `Scope.REQUEST` cho service nghiệp vụ "để lấy request id" | cả nhánh dựng lại mỗi request, p99 tăng | `@ReqId()`, ALS |
| Tưởng TRANSIENT làm singleton phụ thuộc đổi theo request | không đổi: chỉ REQUEST nổi lên | dùng đúng scope |
| `moduleRef.get()` provider scoped | lỗi `InvalidClassScopeException` | `resolve()` |
| Provider REQUEST giả định `req` luôn có | crash khi resolve ngoài HTTP | `req?.` |
| Import tĩnh module định nạp lười | không còn lười | chỉ `load(() => X)` |

## Dùng ở đâu trong `shop-api`
Hook `onModuleInit`/`onApplicationShutdown` là nơi B01 mở/đóng pool DB (TypeORM tự làm), B07 đóng Redis, P03 dừng worker, P02 chuyển sang "not ready" trước khi tắt. REQUEST scope sẽ quay lại ở R06 (tenant) nhưng ta sẽ ưu tiên CLS. `ModuleRef` dùng ở M01/M03 (chọn handler theo loại command). `LazyModuleLoader` là mô hình cho báo cáo nặng ở B04.
