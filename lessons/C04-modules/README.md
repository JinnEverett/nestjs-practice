# C04 · Modules: feature, shared, global, dynamic

Đọc khoảng 11 phút. Ở C03 bạn phải dùng `forwardRef` để Products và Orders biết nhau. Module này sửa gốc vấn đề: vẽ lại **ranh giới module**, rồi làm `PricingModule` cấu hình được từ bên ngoài như các module chuẩn của Nest (`TypeOrmModule.forRoot`, `ConfigModule.forRoot`...).

## Mục tiêu
- Giải thích `providers`, `exports`, `imports`, và vì sao provider không export thì module khác **không thấy**.
- Gỡ vòng phụ thuộc bằng cách tách module thứ ba thay vì `forwardRef`.
- Chọn đúng giữa feature module, shared module và `@Global`.
- Viết dynamic module (`forRoot`/`forRootAsync`) bằng `ConfigurableModuleBuilder`.

## 1. Module là hộp đóng
```ts
@Module({
  imports: [ProductUsageModule],        // dùng được những gì module kia EXPORT
  providers: [ProductsService, { provide: PRODUCTS_REPOSITORY, useClass: InMemoryProductsRepository }],
  exports: [ProductsService],           // phần "công khai"; PRODUCTS_REPOSITORY ở lại bên trong
})
export class ProductsModule {}
```
Quy tắc: provider chỉ inject được (a) trong chính module khai báo nó, (b) ở module `imports` module đó **và** module đó `exports` nó, (c) ở bất kỳ đâu nếu nó nằm trong module `@Global`. Thử inject provider không export thì lỗi `Nest can't resolve dependencies of X (?)`. `exports` chính là API công khai của module; giữ nhỏ để sau còn đổi ruột (B01 đổi repository thành TypeORM mà không ai ngoài biết).

Module cũng là **singleton**: import `ProductsModule` ở ba nơi vẫn là một instance. Ngoại lệ: dynamic module với **tùy chọn khác nhau** là các instance khác nhau (mục 4).

## 2. Gỡ vòng phụ thuộc
C03: `ProductsService ↔ OrdersService` vì xóa sản phẩm cần biết sản phẩm đã vào đơn. Có ba lối thoát, theo thứ tự nên thử:
1. **Tách phần dùng chung ra module thứ ba** mà cả hai cùng import một chiều: `ProductUsageRegistry` trong `ProductUsageModule`. Orders ghi vào, Products đọc. Đồ thị thành `Orders → Products → Usage` và `Orders → Usage`: không còn vòng.
2. Đảo chiều bằng sự kiện (M02): Orders phát `OrderCreated`, Products lắng nghe.
3. `forwardRef`: chỉ khi 1 và 2 quá tốn. Nó che dấu hiệu rằng ranh giới đang sai.

## 3. Shared module và `@Global`
```ts
@Global()
@Module({ imports: [ClockModule], exports: [ClockModule] })
export class SharedModule {}          // import MỘT lần ở AppModule
```
- **Shared module** (không global): module bạn `imports` ở những nơi cần. Rõ ràng, nên là mặc định.
- **`@Global()`**: khỏi `imports` ở từng nơi. Chỉ dùng cho hạ tầng thật sự ai cũng cần (giờ, config, logger). Lạm dụng làm đồ thị phụ thuộc "vô hình": đọc `OrdersModule` không biết nó cần gì.
- Global vẫn phải **được import ở đâu đó** (thường là `AppModule`) để tồn tại.

## 4. Dynamic module
Module nhận cấu hình lúc import:
```ts
imports: [PricingModule.forRoot({ shippingFee: 20_000 })]
imports: [PricingModule.forRootAsync({ imports: [ConfigModule], inject: [ConfigService], useFactory: (c) => ({ shippingFee: c.get('SHIP') }) })]
```
Viết tay là một `static forRoot(): DynamicModule` trả `{ module, providers, exports, global? }` (xem T07: giống một "factory của module"). Phần lặp lại (sync/async, `useClass`/`useFactory`/`useExisting`, `isGlobal`) được `ConfigurableModuleBuilder` sinh sẵn:

```ts
export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<PricingModuleOptions>()
    .setClassMethodName('forRoot')               // forRoot + forRootAsync
    .setFactoryMethodName('createPricingOptions') // cho useClass
    .setExtras({ isGlobal: false }, (def, extras) => ({ ...def, global: extras.isGlobal }))
    .build();

@Module({ providers: [PricingService, { provide: PRICING_RULES, useFactory: (o) => ({ ...DEFAULT_PRICING_RULES, ...o }), inject: [MODULE_OPTIONS_TOKEN] }] , exports: [PricingService] })
export class PricingModule extends ConfigurableModuleClass {}
```
- *Extras* (`isGlobal`) là tùy chọn của **module**, không thuộc về options của provider; builder tách chúng ra.
- Trộn với mặc định (`{ ...DEFAULT, ...options }`) để `forRoot({})` vẫn chạy.
- Bẫy: gọi `PricingModule.forRoot({...})` ở **nhiều nơi** với tùy chọn khác nhau tạo nhiều instance `PricingService` với bảng giá khác nhau. Cấu hình **một lần** ở `AppModule` với `isGlobal: true`, các feature module dùng thẳng `PricingService`.

## Bẫy hay gặp
| Bẫy | Hậu quả | Cách đúng |
|---|---|---|
| Đưa provider vào `providers` của module khác "cho chạy" | hai instance, hai trạng thái | import module sở hữu nó |
| `forRoot()` ở nhiều module với options khác nhau | nhiều instance, cấu hình lệch nhau | cấu hình một lần, `isGlobal` |
| Export mọi thứ | lộ chi tiết nội bộ, khó đổi ruột | chỉ export hợp đồng |
| `@Global` cho mọi module "cho tiện" | phụ thuộc vô hình | chỉ hạ tầng dùng khắp nơi |
| Quên import module global ở `AppModule` | `can't resolve dependencies` | import một lần |
| Trộn nông `codes` mà tưởng trộn sâu | mất mã mặc định khi truyền `codes` | ghi rõ: truyền `codes` là thay cả bảng |

## Dùng ở đâu trong `shop-api`
`PricingModule.forRootAsync` ở C09 nhận giá trị từ `ConfigService`. `SharedModule` về sau chứa logger (P01) và `ClsModule` (B05, R06). Cùng cơ chế với `TypeOrmModule.forRootAsync` (B01), `JwtModule.registerAsync` (A02), `BullModule.forRootAsync` (P03). Ranh giới module ở bài này là nền cho modular monolith (M01).
