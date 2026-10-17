# C03 · Providers và Dependency Injection

Đọc khoảng 12 phút. Ở T07 bạn đã tự viết container DI; bài này dùng cái của Nest và xem nó khớp với `mini-nest` ở đâu. Kết quả: tách lưu trữ khỏi service (repository qua token), thêm `PricingService` và đơn hàng in-memory, rồi dùng đủ các kiểu provider.

## Mục tiêu
- Giải thích Nest tìm dependency bằng **token** (class hoặc `Symbol`/chuỗi) và `design:paramtypes`.
- Dùng đúng `useClass`, `useValue`, `useFactory`, `useExisting`, `@Inject`, `@Optional`.
- Thay provider trong test bằng `overrideProvider`.
- Nhận ra vòng phụ thuộc, xử lý bằng `forwardRef` và biết khi nào đó là mùi thiết kế.

## 1. Provider = (token → cách tạo giá trị)
```ts
providers: [OrdersService]                       // viết tắt của:
providers: [{ provide: OrdersService, useClass: OrdersService }]
```
Constructor inject theo **kiểu** của tham số vì TypeScript ghi `design:paramtypes` (bạn đã thấy ở T06–T07). Interface bị xóa lúc compile nên **không làm token được**; dùng `Symbol` + `@Inject`:
```ts
export const PRODUCTS_REPOSITORY = Symbol('PRODUCTS_REPOSITORY');
export interface ProductsRepository { findById(id: number): Promise<Product | undefined>; /* ... */ }

providers: [{ provide: PRODUCTS_REPOSITORY, useClass: InMemoryProductsRepository }]

constructor(@Inject(PRODUCTS_REPOSITORY) private readonly repo: ProductsRepository) {}
```
Service chỉ biết **hợp đồng** (interface). B01 sẽ đổi sang TypeORM bằng cách đổi một dòng `useClass`, service không sửa.

## 2. Bốn kiểu provider
| Kiểu | Khi nào | Ví dụ trong bài |
|---|---|---|
| `useClass` | tạo bằng `new` với DI đầy đủ; chọn cài đặt theo token | `PRODUCTS_REPOSITORY → InMemoryProductsRepository` |
| `useValue` | hằng, cấu hình, đối tượng dựng sẵn, **fake trong test** | `PRICING_RULES` |
| `useFactory` | giá trị phải tính từ provider khác / env | `NOW = () => clock.now()` với `inject: [ClockService]` |
| `useExisting` | bí danh: token mới trỏ vào **cùng instance** | `ORDER_READER → OrdersService` |

```ts
{ provide: NOW, useFactory: (clock: ClockService) => () => clock.now(), inject: [ClockService] }
{ provide: ORDER_READER, useExisting: OrdersService }   // app.get(ORDER_READER) === app.get(OrdersService)
```
`useClass` hai lần với hai token khác nhau tạo **hai instance**; muốn một instance hai tên thì `useExisting`.

## 3. `@Optional` và `overrideProvider`
```ts
constructor(@Optional() @Inject(ORDER_NOTIFIER) private readonly notifier?: OrderNotifier) {}
```
Không ai đăng ký `ORDER_NOTIFIER` thì Nest truyền `undefined` thay vì ném `Nest can't resolve dependencies`. Dùng cho tính năng cắm thêm (thông báo, audit). Phần gọi nó phải chịu được lỗi: thông báo hỏng không được làm hỏng đơn hàng.

Trong test:
```ts
Test.createTestingModule({ imports: [AppModule] })
  .overrideProvider(PRICING_RULES).useValue({ shippingFee: 10_000, /* ... */ })
  .compile();
```
Đây là lý do mọi thứ phụ thuộc bên ngoài (giờ, ngẫu nhiên, cấu hình, DB) nên đi qua DI.

## 4. Provider mặc định là singleton, và `import type`
- Mỗi provider tạo **một lần** cho ứng dụng; state trong service (như `Map` đơn hàng) dùng chung cho mọi request. Đúng cho in-memory, nguy hiểm nếu bạn lưu dữ liệu **của một request** vào field của service (xem C10 về scope).
- `emitDecoratorMetadata` + `isolatedModules`: type chỉ dùng như kiểu tham số của constructor có decorator phải `import type { X }` (hoặc `import { type X }`), nếu không `tsc` báo `TS1272`.

## 5. Vòng phụ thuộc
`ProductsService` cần biết đơn nào dùng sản phẩm (không cho xóa); `OrdersService` cần giá và tồn kho của sản phẩm. Hai bên cần nhau:
```ts
constructor(@Inject(forwardRef(() => OrdersService)) private readonly orders: OrdersService) {}
// và ở module: imports: [forwardRef(() => OrdersModule)]
```
Không có `forwardRef` thì một trong hai class còn `undefined` lúc decorator chạy (vòng `import` giữa file), hoặc Nest báo `Nest cannot create the module instance` / `can't resolve dependencies (?)`. `forwardRef` chỉ **trì hoãn** việc tra token. Vòng phụ thuộc thường là dấu hiệu ranh giới module sai: C04 và M01 bàn cách tách (đẩy phần chung ra module thứ ba, hoặc đổi chiều phụ thuộc bằng event).

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Dùng `interface` làm token | `Nest can't resolve dependencies` | `Symbol` + `@Inject` |
| `subtotal * 0.1` cho giảm giá | số lẻ, lệch 1 đồng | `Math.floor(subtotal * 10 / 100)` toán nguyên |
| `rules.codes[userInput]` | `"constructor"` lọt qua như một mã hợp lệ | `Object.hasOwn(...)` hoặc `Map` |
| Trừ kho từng dòng trong lúc kiểm tra | dòng sau lỗi, dòng trước đã trừ | kiểm tra hết rồi mới ghi (pha 1 đọc, pha 2 ghi) |
| Tin `unitPrice` client gửi | khách tự đặt giá | lấy giá từ sản phẩm lúc đặt |
| `new PricingService()` trong service khác | không override được | inject |

## Dùng ở đâu trong `shop-api`
`PRODUCTS_REPOSITORY` là điểm cắm của TypeORM (B01) và của bản repository tách lớp (B06). `PRICING_RULES` thành `PricingModule.forRoot(...)` ở C04 và lấy từ config ở C09. `NOW` là cách cô lập thời gian trong test, về sau dùng cho hạn token (A02) và hạn đơn (P03). `ORDER_NOTIFIER` là mầm của event/queue ở R04 và M02.
