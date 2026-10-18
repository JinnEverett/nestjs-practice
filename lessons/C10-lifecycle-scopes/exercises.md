# C10 · Bài tập

Tiếp tục `shop-api` sau C09. Chấm: `bash lessons/check.sh lessons/C10-lifecycle-scopes NN|all`. Hầu hết bài kiểm bằng cách **đếm lần constructor chạy** và **đọc sổ sự kiện**, nên tên file/export phải đúng như dưới đây. Mọi thứ nằm trong `src/lifecycle/` (trừ phần báo cáo ở ex06), đăng ký bằng `LifecycleModule` và import vào `AppModule`.

**Pass:** 6/8 bài, ≤ 2 hint. ex02 (🔮) đúng ≥ 9/11, ex08 (📏) có số đo thật.

---

## 🟢 Cơ bản

### ex01 · Hooks và `LifecycleJournal`
- `src/lifecycle/lifecycle-journal.ts` export `LifecycleJournal` (`@Injectable`, singleton): `events: string[]` và `record(event: string)`. Mỗi **ứng dụng** có một sổ riêng.
- `src/lifecycle/startup.probe.ts` export `StartupProbe`, cài đủ 5 hook (`OnModuleInit`, `OnApplicationBootstrap`, `OnModuleDestroy`, `BeforeApplicationShutdown`, `OnApplicationShutdown`), mỗi hook ghi vào sổ chuỗi `StartupProbe:<tên hook>` (ví dụ `StartupProbe:onModuleInit`).
- `onModuleInit` là `async` và chờ khoảng 15 ms **rồi mới** ghi sự kiện; `onApplicationBootstrap` vẫn phải ghi sau nó (Nest chờ hook async).
- Đăng ký trong `LifecycleModule` (`src/lifecycle/lifecycle.module.ts`, export `LifecycleJournal`), import vào `AppModule`.

### ex02 · 🔮 Thứ tự khởi tạo và tắt
Ghi dự đoán vào `lessons/C10-lifecycle-scopes/answers/ex02.txt` (11 dòng, mỗi dòng một sự kiện theo thứ tự xảy ra) **trước khi chạy**. Ứng dụng được `init()` rồi `close()`:
```ts
const mark = (s: string) => log.push(s);
@Injectable() class Db implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy, OnApplicationShutdown {
  constructor() { mark('Db:constructor'); }
  onModuleInit() { mark('Db:onModuleInit'); }
  onApplicationBootstrap() { mark('Db:onApplicationBootstrap'); }
  onModuleDestroy() { mark('Db:onModuleDestroy'); }
  onApplicationShutdown() { mark('Db:onApplicationShutdown'); }
}
@Injectable() class Repo { constructor(_db: Db) { mark('Repo:constructor'); } }          // không có hook
@Injectable() class Service implements /* như Db */ {
  constructor(_repo: Repo) { mark('Service:constructor'); }
  /* 4 hook ghi 'Service:<hook>' giống Db */
}
@Module({ providers: [Db], exports: [Db] }) class DbModule {}
@Module({ imports: [DbModule], providers: [Repo, Service] }) class AppModule {}
// compile → app.init() → app.close()
```
Nhãn: `Db:constructor`, `Repo:constructor`, `Service:constructor`, `Db:onModuleInit`, `Service:onApplicationShutdown`... (đúng như mã).

---

## 🟡 Kết hợp

### ex03 · Provider bất đồng bộ
`src/lifecycle/broker.ts` export `BROKER` (Symbol), `interface Broker { connected: boolean; close(): Promise<void> }`, `brokerProvider` và `BrokerShutdown`.
- `BROKER` dùng `useFactory: async` (chờ ~20 ms), nhận `LifecycleJournal` qua `inject`, ghi `broker:connected` khi xong và trả `{ connected: true, close }` trong đó `close()` ghi `broker:closed`.
- Nơi inject nhận `Broker` (không phải Promise). Kết nối xong **trước** mọi `onModuleInit` (`broker:connected` đứng trước `StartupProbe:onModuleInit` trong sổ).
- `BrokerShutdown` (`OnApplicationShutdown`) gọi `broker.close()`: khi `app.close()` thì `broker:closed` có đúng 1 lần, sau `StartupProbe:onModuleDestroy`.
- Factory ném lỗi → app không khởi động (`createTestApp` reject với đúng thông điệp lỗi). Thay `BROKER` bằng bản giả trong test đóng được khi tắt.

### ex04 · Scope và scope "nổi"
`src/lifecycle/scopes.ts` export:
- `counters = { singleton, request, transient }` (số lần constructor đã chạy) và các class `SingletonService` (DEFAULT), `RequestScopedService` (`Scope.REQUEST`, nhận `@Inject(REQUEST)`, có `requestId` lấy từ header `x-request-id`, chịu được `REQUEST` là `undefined`), `TransientService` (`Scope.TRANSIENT`). Mỗi instance có `id` duy nhất (`randomUUID()`), constructor tăng counter tương ứng.
- `ConsumerA` (chỉ inject `TransientService`) và `ConsumerB` (inject `TransientService` **và** `RequestScopedService`), cả hai mặc định DEFAULT.
- `ScopeController` (`GET /v1/_scope`, công khai) inject cả bốn và trả `{ requestId, requestScopedId, singletonId, transientIds: [A.transient.id, B.transient.id] }`.
- Kỳ vọng sau 5 request: `request` +5, `transient` +5, `singleton` +0; `singletonId` không đổi; `requestScopedId` khác nhau; `transientIds[0]` không đổi, `transientIds[1]` đổi mỗi request. `requestId` khớp header `X-Request-Id`, kể cả khi chạy song song.
- Hãy tự giải thích: vì sao `ConsumerA` không bị dựng lại còn `ConsumerB` thì có?

### ex05 · `ModuleRef`
Chứng minh bằng test của bạn (bộ chấm kiểm lại): `moduleRef.get` lấy singleton, trùng instance với injection; `get` trên provider REQUEST ném lỗi, `resolve` thì được (và `requestId` là `undefined` khi ngoài HTTP); `resolve` không `contextId` cho instance mới mỗi lần, cùng `ContextIdFactory.create()` thì dùng chung; `resolve(TransientService)` cho instance mới mỗi lần. (Không có mã mới ngoài ex04, hãy xem bộ chấm để hiểu hành vi và viết thử một đoạn trong `playground/`.)

### ex06 · Module nạp lười
- `src/reports/reports.module.ts` (`ReportsModule`, import `ProductsModule`), `reports.service.ts` (`ReportsService.summary(): Promise<{ productCount: number }>`, export thêm `lazyCounters = { constructed: number }` tăng trong constructor), `reports.controller.ts` (`ReportsController`, `GET /v1/_reports/summary`, công khai) dùng `LazyModuleLoader`.
- `ReportsController` nằm trong `AppModule`; **`ReportsModule` thì không** được import tĩnh. Lúc khởi động `lazyCounters.constructed = 0`. Sau nhiều lần gọi (kể cả 8 lần song song lúc đầu) `constructed = 1`. `productCount` phản ánh số sản phẩm hiện có.

---

## 🔴 Thực tế

### ex07 · "Gắn REQUEST scope cho tiện, p99 tăng gấp đôi"
Một dev cần request id trong `ProductsService`, gắn `Scope.REQUEST`, và cả `ProductsController` thành request-scoped mà không ai để ý. Bộ chấm duyệt đồ thị phụ thuộc của ứng dụng:
- Chỉ `ScopeController`, `RequestScopedService`, `ConsumerB` (nhóm demo ở ex04) được phép **không tĩnh**; mọi controller/service nghiệp vụ (`Products*`, `Orders*`, `Pricing*`, interceptor, filter...) phải vẫn là singleton.
- Muốn có request id ở nơi cần, dùng `@ReqId()` ở controller và truyền xuống như tham số (hoặc ALS ở P01), đừng kéo REQUEST scope vào service nghiệp vụ.

### ex08 · 📏 Đo chi phí scope
Chạy `bench` (xem `CLAUDE.md`) với hai kịch bản: `GET /v1/products/1` (DEFAULT) và `GET /v1/_scope` (REQUEST), mỗi cái ở `10` và `100` connection. Viết `lessons/C10-lifecycle-scopes/answers/ex08.md` gồm: mục **Dự đoán** (viết trước khi đo, ước lượng chênh lệch %), mục **Kết quả** với bảng `| kịch bản | conns | RPS | p99 ms |` (ít nhất 4 dòng số), và mục giải thích: vì sao REQUEST scope chậm hơn (nhắc dựng lại instance mỗi request). Bộ chấm kiểm cấu trúc, không kiểm con số.

---

> 📏 Thêm: nếu `ConsumerB` có thêm 10 provider phụ thuộc, chi phí mỗi request tăng thế nào? Thử, và đo lại bằng `counters`. Đây là lý do cây phụ thuộc request-scoped phải nhỏ.
